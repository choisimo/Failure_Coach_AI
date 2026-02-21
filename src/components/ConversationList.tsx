import {
  DragEvent,
  KeyboardEvent,
  UIEventHandler,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown, PencilLine, Trash2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { cn } from "@/lib/utils";
import {
  CloseGlyphIcon,
  DialogOrbitIcon,
  WorkspaceStackIcon,
} from "@/components/icons/AgenticIcons";

const DRAG_DATA_KEY = "application/x-failure-coach-conversation-ids";

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  mode?: "GUIDED" | "CUSTOM";
  personaTitle?: string;
  customPrompt?: string;
  sessionId?: string;
  workspaceId?: string | null;
}

export interface ConversationWorkspace {
  id: string;
  name: string;
  conversationIds: string[];
  createdAt: Date;
  collapsed?: boolean;
}

interface ConversationListProps {
  conversations: Conversation[];
  workspaces?: ConversationWorkspace[];
  activeId?: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
  onCreateWorkspace?: (conversationIds: string[]) => void;
  onMoveToWorkspace?: (conversationIds: string[], workspaceId: string | null) => void;
  onToggleWorkspace?: (workspaceId: string) => void;
  onRenameWorkspace?: (workspaceId: string, name: string) => void;
  onDeleteWorkspace?: (workspaceId: string) => void;
}

export const ConversationList = ({
  conversations,
  workspaces = [],
  activeId,
  onSelect,
  onDelete,
  onCreateWorkspace,
  onMoveToWorkspace,
  onToggleWorkspace,
  onRenameWorkspace,
  onDeleteWorkspace,
}: ConversationListProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [draggingIds, setDraggingIds] = useState<string[]>([]);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [workspaceNameDraft, setWorkspaceNameDraft] = useState("");

  const orderedConversationIds = useMemo(
    () => conversations.map((conversation) => conversation.id),
    [conversations]
  );
  const conversationIdSet = useMemo(
    () => new Set(orderedConversationIds),
    [orderedConversationIds]
  );
  const conversationMap = useMemo(
    () => new Map(conversations.map((conversation) => [conversation.id, conversation])),
    [conversations]
  );

  const normalizeConversationIds = useCallback(
    (ids: string[]) => {
      const seen = new Set<string>();
      return orderedConversationIds.filter((id) => {
        if (!ids.includes(id)) return false;
        if (seen.has(id) || !conversationIdSet.has(id)) return false;
        seen.add(id);
        return true;
      });
    },
    [conversationIdSet, orderedConversationIds]
  );

  useEffect(() => {
    setSelectedConversationIds((prev) => normalizeConversationIds(prev));
  }, [conversations, normalizeConversationIds]);

  const updateScrollState = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const scrollable = viewport.scrollHeight - viewport.clientHeight > 1;
    const atBottom = viewport.scrollTop + viewport.clientHeight >= viewport.scrollHeight - 1;

    setIsScrollable(scrollable);
    setIsAtBottom(!scrollable || atBottom);
  }, []);

  useEffect(() => {
    updateScrollState();
  }, [conversations, workspaces, updateScrollState]);

  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const target = event.currentTarget;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
    setIsAtBottom(atBottom);
  };

  const readDragConversationIds = useCallback(
    (event: DragEvent<HTMLElement>) => {
      const payload = event.dataTransfer.getData(DRAG_DATA_KEY);
      if (!payload) return normalizeConversationIds(draggingIds);
      try {
        const parsed = JSON.parse(payload);
        if (!Array.isArray(parsed)) return [];
        return normalizeConversationIds(parsed.filter((item): item is string => typeof item === "string"));
      } catch {
        return [];
      }
    },
    [draggingIds, normalizeConversationIds]
  );

  const toggleSelection = (conversationId: string) => {
    setSelectedConversationIds((prev) => {
      if (prev.includes(conversationId)) {
        return prev.filter((id) => id !== conversationId);
      }
      return normalizeConversationIds([...prev, conversationId]);
    });
  };

  const handleConversationDragStart = (event: DragEvent<HTMLElement>, conversationId: string) => {
    const dragIds =
      selectedConversationIds.includes(conversationId) && selectedConversationIds.length > 1
        ? normalizeConversationIds(selectedConversationIds)
        : [conversationId];

    setDraggingIds(dragIds);
    event.dataTransfer.setData(DRAG_DATA_KEY, JSON.stringify(dragIds));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleConversationDragEnd = () => {
    setDraggingIds([]);
    setDragOverTarget(null);
  };

  const workspaceEntries = useMemo(
    () =>
      workspaces
        .map((workspace) => ({
          workspace,
          conversations: normalizeConversationIds(workspace.conversationIds)
            .map((conversationId) => conversationMap.get(conversationId))
            .filter((conversation): conversation is Conversation => Boolean(conversation)),
        }))
        .filter((entry) => entry.conversations.length > 0),
    [conversationMap, normalizeConversationIds, workspaces]
  );

  const workspaceIdSet = useMemo(
    () => new Set(workspaceEntries.map((entry) => entry.workspace.id)),
    [workspaceEntries]
  );

  const ungroupedConversations = useMemo(
    () =>
      conversations.filter(
        (conversation) => !conversation.workspaceId || !workspaceIdSet.has(conversation.workspaceId)
      ),
    [conversations, workspaceIdSet]
  );

  const startRenameWorkspace = (workspace: ConversationWorkspace) => {
    setEditingWorkspaceId(workspace.id);
    setWorkspaceNameDraft(workspace.name);
  };

  const commitRenameWorkspace = (workspaceId: string) => {
    const nextName = workspaceNameDraft.trim();
    if (nextName && onRenameWorkspace) {
      onRenameWorkspace(workspaceId, nextName);
    }
    setEditingWorkspaceId(null);
    setWorkspaceNameDraft("");
  };

  const renderConversationItem = (conversation: Conversation) => {
    const isActive = activeId === conversation.id;
    const isSelected = selectedConversationIds.includes(conversation.id);
    const isDragging = draggingIds.includes(conversation.id);

    return (
      <li key={conversation.id}>
        <article
          draggable
          onDragStart={(event) => handleConversationDragStart(event, conversation.id)}
          onDragEnd={handleConversationDragEnd}
          className={cn(
            "group relative rounded-xl border transition-all duration-200",
            "animate-slide-up",
            isActive
              ? "bg-primary/[0.08] border-primary/30 shadow-sm"
              : "bg-card/50 border-border/50 hover:bg-sidebar-accent/70 hover:border-border",
            isSelected && "ring-1 ring-primary/45",
            isDragging && "scale-[0.985] opacity-65"
          )}
          aria-current={isActive ? "true" : undefined}
        >
          {isActive && (
            <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" aria-hidden="true" />
          )}

          <button
            type="button"
            onClick={() => onSelect(conversation.id)}
            className="flex w-full items-start gap-3 px-3 py-3 pr-16 text-left"
          >
            <div
              className={cn(
                "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                isActive || isSelected ? "bg-primary/[0.15]" : "bg-muted/50"
              )}
              aria-hidden="true"
            >
              <DialogOrbitIcon
                className={cn(
                  "h-4.5 w-4.5",
                  isActive || isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    "flex-1 truncate text-sm leading-tight",
                    isActive ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                  )}
                >
                  {conversation.title}
                </p>
                {conversation.mode === "CUSTOM" && (
                  <Badge variant="secondary" className="h-5 shrink-0 px-1.5 py-0 text-[10px]">
                    커스텀
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2">
                {conversation.personaTitle ? (
                  <p className="flex-1 truncate text-[11px] text-muted-foreground" title={conversation.personaTitle}>
                    {conversation.personaTitle}
                  </p>
                ) : (
                  <p className="flex-1 truncate text-[11px] text-muted-foreground/80" title={conversation.lastMessage}>
                    {conversation.lastMessage || "메시지가 아직 없습니다"}
                  </p>
                )}
                <time
                  className="shrink-0 text-[11px] text-muted-foreground/70"
                  dateTime={conversation.timestamp.toISOString()}
                >
                  {conversation.timestamp.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                </time>
              </div>
            </div>
          </button>

          <div
            className={cn(
              "absolute right-2 top-2 flex items-center gap-1 opacity-100 transition-opacity duration-200",
              !isSelected && "group-hover:opacity-100 group-focus-within:opacity-100"
            )}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                toggleSelection(conversation.id);
              }}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
                isSelected
                  ? "border-primary/60 bg-primary/20 text-primary"
                  : "border-border/70 bg-background/60 text-muted-foreground hover:border-primary/40"
              )}
              aria-label={isSelected ? "선택 해제" : "선택"}
            >
              {isSelected ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-current/65" />}
            </button>

            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(conversation.id);
                  setSelectedConversationIds((prev) => prev.filter((id) => id !== conversation.id));
                }}
                className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-background/60 text-muted-foreground transition-colors hover:border-destructive/45 hover:bg-destructive/10 hover:text-destructive"
                aria-label="대화 삭제"
              >
                <CloseGlyphIcon className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </article>
      </li>
    );
  };

  return (
    <nav className="flex h-full flex-col" aria-label="대화 목록">
      <ScrollArea
        className="flex-1"
        viewportRef={viewportRef}
        viewportOnScroll={handleScroll}
        viewportClassName={cn("pr-1 thin-scrollbar", isScrollable && !isAtBottom && "mask-fade-bottom")}
      >
        <div className="relative space-y-3 px-1 py-2">
          {conversations.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50">
                <DialogOrbitIcon className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground/80">아직 대화가 없습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">아래의 새 대화 버튼으로 시작해보세요</p>
            </div>
          ) : (
            <>
              {(onCreateWorkspace || onMoveToWorkspace) && (
                <div className="space-y-2 px-1">
                  {onCreateWorkspace && (
                    <div
                      className={cn(
                        "rounded-xl border border-dashed px-3 py-2.5 transition-all duration-200",
                        "bg-sidebar-accent/35 text-xs text-muted-foreground",
                        dragOverTarget === "new-workspace"
                          ? "workspace-drop-pulse border-primary/60 bg-primary/[0.14] text-primary"
                          : "border-sidebar-border/80"
                      )}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverTarget("new-workspace");
                      }}
                      onDragLeave={() => setDragOverTarget((prev) => (prev === "new-workspace" ? null : prev))}
                      onDrop={(event) => {
                        event.preventDefault();
                        const ids = readDragConversationIds(event);
                        if (ids.length > 0) {
                          onCreateWorkspace(ids);
                          setSelectedConversationIds(ids);
                        }
                        setDragOverTarget(null);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <WorkspaceStackIcon className="h-4 w-4" />
                        <span className="font-medium">여기로 드래그해 워크스페이스 생성</span>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground/80">
                        여러 블록을 선택 후 드래그하면 폴더형 워크스페이스로 묶을 수 있습니다.
                      </p>
                    </div>
                  )}

                  {onMoveToWorkspace && workspaces.length > 0 && (
                    <div
                      className={cn(
                        "rounded-lg border border-dashed px-3 py-2 text-[11px] transition-all duration-200",
                        dragOverTarget === "ungrouped"
                          ? "border-primary/60 bg-primary/[0.12] text-primary"
                          : "border-border/70 bg-background/35 text-muted-foreground"
                      )}
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragOverTarget("ungrouped");
                      }}
                      onDragLeave={() => setDragOverTarget((prev) => (prev === "ungrouped" ? null : prev))}
                      onDrop={(event) => {
                        event.preventDefault();
                        const ids = readDragConversationIds(event);
                        if (ids.length > 0) {
                          onMoveToWorkspace(ids, null);
                        }
                        setDragOverTarget(null);
                      }}
                    >
                      워크스페이스 해제 영역 (여기로 드롭)
                    </div>
                  )}
                </div>
              )}

              {selectedConversationIds.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/[0.1] px-3 py-2 text-[11px] text-primary">
                  <span>{selectedConversationIds.length}개 대화 선택됨</span>
                  <div className="flex items-center gap-2">
                    {onCreateWorkspace && selectedConversationIds.length > 1 && (
                      <button
                        type="button"
                        className="font-medium text-primary/90 hover:text-primary"
                        onClick={() => onCreateWorkspace(selectedConversationIds)}
                      >
                        폴더 만들기
                      </button>
                    )}
                    <button
                      type="button"
                      className="font-medium text-primary/90 hover:text-primary"
                      onClick={() => setSelectedConversationIds([])}
                    >
                      선택 해제
                    </button>
                  </div>
                </div>
              )}

              {workspaceEntries.length > 0 && (
                <ul className="space-y-2">
                  {workspaceEntries.map(({ workspace, conversations: workspaceConversations }) => (
                    <li key={workspace.id}>
                      <section
                        className={cn(
                          "rounded-xl border border-border/55 bg-sidebar-accent/25 transition-all duration-200",
                          dragOverTarget === `workspace:${workspace.id}` &&
                            "workspace-drop-pulse border-primary/60 bg-primary/[0.12]"
                        )}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragOverTarget(`workspace:${workspace.id}`);
                        }}
                        onDragLeave={() =>
                          setDragOverTarget((prev) => (prev === `workspace:${workspace.id}` ? null : prev))
                        }
                        onDrop={(event) => {
                          event.preventDefault();
                          const ids = readDragConversationIds(event);
                          if (ids.length > 0) {
                            onMoveToWorkspace?.(ids, workspace.id);
                          }
                          setDragOverTarget(null);
                        }}
                      >
                        <div className="flex items-center gap-2 border-b border-border/40 px-2.5 py-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-muted-foreground"
                            onClick={() => onToggleWorkspace?.(workspace.id)}
                            aria-label={workspace.collapsed ? "워크스페이스 펼치기" : "워크스페이스 접기"}
                          >
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 transition-transform duration-200",
                                workspace.collapsed && "-rotate-90"
                              )}
                            />
                          </Button>

                          <WorkspaceStackIcon className="h-4 w-4 text-primary/90" />

                          {editingWorkspaceId === workspace.id ? (
                            <Input
                              autoFocus
                              value={workspaceNameDraft}
                              onChange={(event) => setWorkspaceNameDraft(event.target.value)}
                              onBlur={() => commitRenameWorkspace(workspace.id)}
                              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  commitRenameWorkspace(workspace.id);
                                }
                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  setEditingWorkspaceId(null);
                                  setWorkspaceNameDraft("");
                                }
                              }}
                              className="h-7 flex-1"
                            />
                          ) : (
                            <button
                              type="button"
                              onDoubleClick={() => startRenameWorkspace(workspace)}
                              className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-foreground"
                            >
                              {workspace.name}
                            </button>
                          )}

                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            {workspaceConversations.length}
                          </Badge>

                          {onRenameWorkspace && editingWorkspaceId !== workspace.id && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground"
                              onClick={() => startRenameWorkspace(workspace)}
                              aria-label="워크스페이스 이름 변경"
                            >
                              <PencilLine className="h-3.5 w-3.5" />
                            </Button>
                          )}

                          {onDeleteWorkspace && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive"
                              onClick={() => onDeleteWorkspace(workspace.id)}
                              aria-label="워크스페이스 삭제"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>

                        <div
                          className={cn(
                            "grid transition-all duration-300",
                            workspace.collapsed
                              ? "grid-rows-[0fr] opacity-0"
                              : "grid-rows-[1fr] opacity-100"
                          )}
                        >
                          <div className="overflow-hidden">
                            <ul className="space-y-2 p-2">
                              {workspaceConversations.map((conversation) => renderConversationItem(conversation))}
                            </ul>
                          </div>
                        </div>
                      </section>
                    </li>
                  ))}
                </ul>
              )}

              {ungroupedConversations.length > 0 && (
                <div className="space-y-2">
                  {workspaceEntries.length > 0 && (
                    <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                      워크스페이스 외 대화
                    </p>
                  )}
                  <ul className="space-y-2">
                    {ungroupedConversations.map((conversation) => renderConversationItem(conversation))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        {isScrollable && !isAtBottom && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-sidebar"
            aria-hidden="true"
          />
        )}
      </ScrollArea>
    </nav>
  );
};
