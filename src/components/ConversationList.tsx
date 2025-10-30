import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
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
    <div className="flex flex-col h-full">
      <ScrollArea
        className="flex-1"
        viewportRef={viewportRef}
        viewportOnScroll={handleScroll}
        viewportClassName={cn(
          "pr-1 thin-scrollbar",
          isScrollable && !isAtBottom && "mask-fade-bottom"
        )}
      >
        <div className="relative space-y-4 px-2.5 py-3 sm:px-3.5">

          {conversations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <img src="/placeholder.svg" alt="empty" className="mx-auto mb-3 h-12 w-12 opacity-60" />
              <p className="font-medium">아직 대화가 없습니다</p>
              <p className="text-xs mt-1">왼쪽 하단의 새 대화 버튼으로 시작해보세요</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                type="button"
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "group relative w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-left transition-colors duration-200",
                  "hover:bg-sidebar-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  activeId === conv.id && "border-primary/50 bg-sidebar-accent/80 shadow-md"
                )}
              >
                {activeId === conv.id && <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden="true" />}
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15">
                    <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="flex-1 truncate text-sm font-semibold leading-tight" title={conv.title}>
                            {conv.title}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="start" className="max-w-xs text-xs">
                          {conv.title}
                        </TooltipContent>
                      </Tooltip>
                      <time className="shrink-0 text-[11px] text-muted-foreground/70">
                        {conv.timestamp.toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                      </time>
                      {conv.mode === "CUSTOM" && (
                        <Badge variant="secondary" className="shrink-0 whitespace-nowrap text-[10px]">커스텀</Badge>
                      )}
                    </div>
                    {conv.personaTitle && (
                      <p className="mt-1 truncate text-[11px] text-muted-foreground" title={conv.personaTitle}>
                        {conv.personaTitle}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}

          {isScrollable && !isAtBottom && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent to-sidebar" aria-hidden="true" />
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
