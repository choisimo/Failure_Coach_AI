import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Message } from "@/components/ChatMessage";
import { Conversation, ConversationWorkspace } from "@/components/ConversationList";
import { Insight } from "@/components/InsightCard";

interface ChatState {
  conversations: Conversation[];
  workspaces: ConversationWorkspace[];
  messages: Record<string, Message[]>;
  insights: Insight[];
  activeConversationId: string | null;

  addConversation: (opts?: { mode?: "GUIDED" | "CUSTOM"; customPrompt?: string; personaTitle?: string }) => string;
  deleteConversation: (conversationId: string) => void;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => void;
  updateMessage: (conversationId: string, messageId: string, patch: Partial<Message>) => void;
  saveInsight: (conversationId: string, messageId: string) => void;
  deleteInsight: (insightId: string) => void;
  updateInsightNote: (insightId: string, note: string) => void;
  createWorkspace: (opts: { name?: string; conversationIds: string[] }) => string | null;
  renameWorkspace: (workspaceId: string, name: string) => void;
  deleteWorkspace: (workspaceId: string, preserveConversations?: boolean) => void;
  moveConversationsToWorkspace: (conversationIds: string[], workspaceId: string | null) => void;
  toggleWorkspaceCollapsed: (workspaceId: string) => void;
  setActiveConversation: (id: string | null) => void;
  getActiveMessages: () => Message[];
  getActiveConversation: () => Conversation | undefined;
  updateConversation: (conversationId: string, patch: Partial<Conversation>) => void;
}

const createWorkspaceId = () =>
  `ws-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeConversationIds = (conversations: Conversation[], ids: string[]) => {
  const conversationSet = new Set(conversations.map((conversation) => conversation.id));
  const seen = new Set<string>();
  const orderMap = new Map(conversations.map((conversation, index) => [conversation.id, index]));

  return ids
    .filter((id) => {
      if (!conversationSet.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .sort((a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0));
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      workspaces: [],
      messages: {},
      insights: [],
      activeConversationId: null,

      addConversation: (opts) => {
        const id = `conv-${Date.now()}`;
        const mode = opts?.mode ?? "GUIDED";
        const personaTitle = opts?.personaTitle;
        const customPrompt = opts?.customPrompt;
        const title = personaTitle || (mode === "CUSTOM" ? "커스텀 세션" : "새로운 대화");
        const newConversation: Conversation = {
          id,
          title,
          lastMessage: "",
          timestamp: new Date(),
          mode,
          personaTitle,
          customPrompt,
          workspaceId: null,
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          messages: { ...state.messages, [id]: [] },
          activeConversationId: id,
        }));
        return id;
      },

      deleteConversation: (conversationId) => {
        set((state) => {
          const targetExists = state.conversations.some((conversation) => conversation.id === conversationId);
          if (!targetExists) return state;

          const nextConversations = state.conversations.filter(
            (conversation) => conversation.id !== conversationId
          );

          const { [conversationId]: _removedMessages, ...nextMessages } = state.messages;
          const nextInsights = state.insights.filter((insight) => insight.conversationId !== conversationId);
          const nextWorkspaces = state.workspaces
            .map((workspace) => ({
              ...workspace,
              conversationIds: workspace.conversationIds.filter((id) => id !== conversationId),
            }))
            .filter((workspace) => workspace.conversationIds.length > 0);

          const nextActiveConversationId =
            state.activeConversationId === conversationId
              ? nextConversations[0]?.id ?? null
              : state.activeConversationId;

          return {
            conversations: nextConversations,
            messages: nextMessages,
            insights: nextInsights,
            workspaces: nextWorkspaces,
            activeConversationId: nextActiveConversationId,
          };
        });
      },

      addMessage: (conversationId, message) => {
        const id = `msg-${Date.now()}-${Math.random()}`;
        const fullMessage: Message = {
          ...message,
          id,
          timestamp: new Date(),
        };

        set((state) => {
          const conversationMessages = state.messages[conversationId] || [];
          const updatedMessages = [...conversationMessages, fullMessage];

          const updatedConversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                title:
                  conversationMessages.length === 0 && message.role === "user" && conv.mode !== "CUSTOM"
                    ? message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "")
                    : conv.title,
                lastMessage: message.content.slice(0, 100),
                timestamp: new Date(),
              };
            }
            return conv;
          });

          return {
            messages: { ...state.messages, [conversationId]: updatedMessages },
            conversations: updatedConversations,
          };
        });
      },

      updateMessage: (conversationId, messageId, patch) => {
        set((state) => {
          const list = state.messages[conversationId] || [];
          const updated = list.map((m) => (m.id === messageId ? { ...m, ...patch } : m));

          // If the updated message is the last one, refresh lastMessage
          const isLast = list[list.length - 1]?.id === messageId;
          const lastContent = isLast ? (patch.content ?? list[list.length - 1]?.content) : undefined;

          const updatedConversations = state.conversations.map((c) =>
            c.id !== conversationId
              ? c
              : {
                  ...c,
                  lastMessage: lastContent != null ? String(lastContent).slice(0, 100) : c.lastMessage,
                  timestamp: new Date(),
                }
          );

          return {
            messages: { ...state.messages, [conversationId]: updated },
            conversations: updatedConversations,
          };
        });
      },

      saveInsight: (conversationId, messageId) => {
        const state = get();
        const message = state.messages[conversationId]?.find((m) => m.id === messageId);
        const conversation = state.conversations.find((c) => c.id === conversationId);

        if (!message || message.role !== "assistant" || !conversation) return;

        // Check if already saved
        const existingInsight = state.insights.find((i) => i.messageId === messageId);
        if (existingInsight) {
          // Remove if already saved
          set((state) => ({
            insights: state.insights.filter((i) => i.id !== existingInsight.id),
            messages: {
              ...state.messages,
              [conversationId]: state.messages[conversationId].map((m) =>
                m.id === messageId ? { ...m, saved: false } : m
              ),
            },
          }));
          return;
        }

        const insight: Insight = {
          id: `insight-${Date.now()}`,
          messageId,
          conversationId,
          content: message.content,
          conversationTitle: conversation.title,
          timestamp: new Date(),
        };

        set((state) => ({
          insights: [insight, ...state.insights],
          messages: {
            ...state.messages,
            [conversationId]: state.messages[conversationId].map((m) =>
              m.id === messageId ? { ...m, saved: true } : m
            ),
          },
        }));
      },

      deleteInsight: (insightId) => {
        const state = get();
        const insight = state.insights.find((i) => i.id === insightId);
        if (!insight) return;

        set((state) => ({
          insights: state.insights.filter((i) => i.id !== insightId),
        }));
      },

      updateInsightNote: (insightId, note) => {
        set((state) => ({
          insights: state.insights.map((i) => (i.id === insightId ? { ...i, note } : i)),
        }));
      },

      createWorkspace: ({ name, conversationIds }) => {
        const normalizedName = name?.trim();
        const currentConversations = get().conversations;
        const ids = normalizeConversationIds(currentConversations, conversationIds);
        if (ids.length === 0) return null;

        const workspaceId = createWorkspaceId();

        set((state) => {
          const detachedWorkspaces = state.workspaces
            .map((workspace) => ({
              ...workspace,
              conversationIds: workspace.conversationIds.filter((id) => !ids.includes(id)),
            }))
            .filter((workspace) => workspace.conversationIds.length > 0);

          const workspaceName =
            normalizedName && normalizedName.length > 0
              ? normalizedName
              : `워크스페이스 ${detachedWorkspaces.length + 1}`;

          const workspace: ConversationWorkspace = {
            id: workspaceId,
            name: workspaceName,
            conversationIds: ids,
            createdAt: new Date(),
            collapsed: false,
          };

          const nextConversations = state.conversations.map((conversation) =>
            ids.includes(conversation.id)
              ? { ...conversation, workspaceId }
              : conversation
          );

          return {
            conversations: nextConversations,
            workspaces: [workspace, ...detachedWorkspaces],
          };
        });

        return workspaceId;
      },

      renameWorkspace: (workspaceId, name) => {
        const nextName = name.trim();
        if (!nextName) return;

        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === workspaceId ? { ...workspace, name: nextName } : workspace
          ),
        }));
      },

      deleteWorkspace: (workspaceId, preserveConversations = true) => {
        set((state) => {
          const workspace = state.workspaces.find((item) => item.id === workspaceId);
          if (!workspace) return state;

          if (preserveConversations) {
            return {
              workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
              conversations: state.conversations.map((conversation) =>
                conversation.workspaceId === workspaceId
                  ? { ...conversation, workspaceId: null }
                  : conversation
              ),
            };
          }

          const toDelete = new Set(workspace.conversationIds);
          const nextConversations = state.conversations.filter((conversation) => !toDelete.has(conversation.id));
          const nextMessages = Object.fromEntries(
            Object.entries(state.messages).filter(([conversationId]) => !toDelete.has(conversationId))
          );
          const nextInsights = state.insights.filter((insight) => !toDelete.has(insight.conversationId ?? ""));
          const nextActiveConversationId =
            state.activeConversationId && toDelete.has(state.activeConversationId)
              ? nextConversations[0]?.id ?? null
              : state.activeConversationId;

          return {
            workspaces: state.workspaces.filter((item) => item.id !== workspaceId),
            conversations: nextConversations,
            messages: nextMessages,
            insights: nextInsights,
            activeConversationId: nextActiveConversationId,
          };
        });
      },

      moveConversationsToWorkspace: (conversationIds, workspaceId) => {
        set((state) => {
          const ids = normalizeConversationIds(state.conversations, conversationIds);
          if (ids.length === 0) return state;

          const hasTargetWorkspace =
            workspaceId == null || state.workspaces.some((workspace) => workspace.id === workspaceId);
          if (!hasTargetWorkspace) return state;

          const idSet = new Set(ids);
          const strippedWorkspaces = state.workspaces
            .map((workspace) => ({
              ...workspace,
              conversationIds: workspace.conversationIds.filter((id) => !idSet.has(id)),
            }))
            .filter((workspace) => workspace.conversationIds.length > 0 || workspace.id === workspaceId);

          const nextWorkspaces =
            workspaceId == null
              ? strippedWorkspaces.filter((workspace) => workspace.conversationIds.length > 0)
              : strippedWorkspaces.map((workspace) =>
                  workspace.id === workspaceId
                    ? {
                        ...workspace,
                        conversationIds: [
                          ...ids,
                          ...workspace.conversationIds.filter((id) => !idSet.has(id)),
                        ],
                      }
                    : workspace
                );

          const nextConversations = state.conversations.map((conversation) =>
            idSet.has(conversation.id)
              ? { ...conversation, workspaceId: workspaceId ?? null }
              : conversation
          );

          return {
            workspaces: nextWorkspaces,
            conversations: nextConversations,
          };
        });
      },

      toggleWorkspaceCollapsed: (workspaceId) => {
        set((state) => ({
          workspaces: state.workspaces.map((workspace) =>
            workspace.id === workspaceId
              ? { ...workspace, collapsed: !workspace.collapsed }
              : workspace
          ),
        }));
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      getActiveMessages: () => {
        const state = get();
        if (!state.activeConversationId) return [];
        return state.messages[state.activeConversationId] || [];
      },

      getActiveConversation: () => {
        const state = get();
        if (!state.activeConversationId) return undefined;
        return state.conversations.find((c) => c.id === state.activeConversationId);
      },

      updateConversation: (conversationId, patch) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, ...patch, timestamp: new Date() } : c
          ),
        }));
      },
    }),
    {
      name: "chat-storage",
      storage: createJSONStorage(() => localStorage, {
        reviver: (_key, value) => {
          if (typeof value !== "string") return value;

          const isoDatePattern =
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

          if (!isoDatePattern.test(value)) return value;

          const parsed = new Date(value);
          return Number.isNaN(parsed.getTime()) ? value : parsed;
        },
      }),
    }
  )
);
