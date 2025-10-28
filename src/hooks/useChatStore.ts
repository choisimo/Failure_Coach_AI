import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Message } from "@/components/ChatMessage";
import { Conversation } from "@/components/ConversationList";
import { Insight } from "@/components/InsightCard";

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  insights: Insight[];
  activeConversationId: string | null;

  addConversation: () => string;
  addMessage: (conversationId: string, message: Omit<Message, "id" | "timestamp">) => void;
  saveInsight: (conversationId: string, messageId: string) => void;
  deleteInsight: (insightId: string) => void;
  updateInsightNote: (insightId: string, note: string) => void;
  setActiveConversation: (id: string | null) => void;
  getActiveMessages: () => Message[];
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      insights: [],
      activeConversationId: null,

      addConversation: () => {
        const id = `conv-${Date.now()}`;
        const newConversation: Conversation = {
          id,
          title: "새로운 대화",
          lastMessage: "",
          timestamp: new Date(),
        };
        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          messages: { ...state.messages, [id]: [] },
          activeConversationId: id,
        }));
        return id;
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

          // Update conversation title and last message
          const updatedConversations = state.conversations.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                title:
                  conversationMessages.length === 0 && message.role === "user"
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

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      getActiveMessages: () => {
        const state = get();
        if (!state.activeConversationId) return [];
        return state.messages[state.activeConversationId] || [];
      },
    }),
    {
      name: "chat-storage",
    }
  )
);
