import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  mode?: "GUIDED" | "CUSTOM";
  personaTitle?: string;
  customPrompt?: string;
  sessionId?: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
}

export const ConversationList = ({
  conversations,
  activeId,
  onSelect,
}: ConversationListProps) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

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
  }, [conversations, updateScrollState]);

  useEffect(() => {
    const handleResize = () => updateScrollState();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updateScrollState]);

  const handleScroll: React.UIEventHandler<HTMLDivElement> = (event) => {
    const target = event.currentTarget;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
    setIsAtBottom(atBottom);
  };

  return (
    <nav className="flex flex-col h-full" aria-label="대화 목록">
      <ScrollArea
        className="flex-1"
        viewportRef={viewportRef}
        viewportOnScroll={handleScroll}
        viewportClassName={cn(
          "pr-1 thin-scrollbar",
          isScrollable && !isAtBottom && "mask-fade-bottom"
        )}
      >
        <ul className="relative space-y-2 px-1 py-2">
          {conversations.length === 0 ? (
            <li className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground/60" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground/80">아직 대화가 없습니다</p>
              <p className="text-xs text-muted-foreground mt-1">
                아래의 새 대화 버튼으로 시작해보세요
              </p>
            </li>
          ) : (
            conversations.map((conv) => (
              <li key={conv.id}>
                <button
                  type="button"
                  onClick={() => onSelect(conv.id)}
                  className={cn(
                    "group relative w-full text-left rounded-xl border transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                    activeId === conv.id
                      ? "bg-primary/[0.08] border-primary/30 shadow-sm"
                      : "bg-card/50 border-border/50 hover:bg-sidebar-accent/60 hover:border-border"
                  )}
                  aria-current={activeId === conv.id ? "true" : undefined}
                >
                  {activeId === conv.id && (
                    <span 
                      className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" 
                      aria-hidden="true" 
                    />
                  )}
                  <div className="flex items-start gap-3 px-3 py-3">
                    <div 
                      className={cn(
                        "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                        activeId === conv.id ? "bg-primary/[0.15]" : "bg-muted/50"
                      )}
                      aria-hidden="true"
                    >
                      <MessageSquare className={cn(
                        "h-4 w-4",
                        activeId === conv.id ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p 
                          className={cn(
                            "flex-1 truncate text-sm leading-tight",
                            activeId === conv.id ? "font-semibold text-foreground" : "font-medium text-foreground/90"
                          )}
                        >
                          {conv.title}
                        </p>
                        {conv.mode === "CUSTOM" && (
                          <Badge 
                            variant="secondary" 
                            className="shrink-0 text-[10px] px-1.5 py-0 h-5"
                          >
                            커스텀
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {conv.personaTitle && (
                          <p 
                            className="truncate text-[11px] text-muted-foreground flex-1" 
                            title={conv.personaTitle}
                          >
                            {conv.personaTitle}
                          </p>
                        )}
                        <time 
                          className="shrink-0 text-[11px] text-muted-foreground/70"
                          dateTime={conv.timestamp.toISOString()}
                        >
                          {conv.timestamp.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </time>
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>

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
