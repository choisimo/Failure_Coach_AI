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
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">

          {conversations.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <img src="/placeholder.svg" alt="empty" className="mx-auto mb-3 h-12 w-12 opacity-60" />
              <p className="font-medium">아직 대화가 없습니다</p>
              <p className="text-xs mt-1">왼쪽 하단의 새 대화 버튼으로 시작해보세요</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  "w-full text-left rounded-xl transition-colors border",
                  "bg-card hover:bg-sidebar-accent border-border",
                  "shadow-sm hover:shadow-md",
                  activeId === conv.id && "ring-2 ring-primary/40 border-primary/40"
                )}
              >
                <div className="p-3 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <p className="text-sm font-semibold truncate">{conv.title}</p>
                      {conv.mode === "CUSTOM" && (
                        <Badge variant="secondary" className="shrink-0">커스텀</Badge>
                      )}
                    </div>
                    {conv.personaTitle && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{conv.personaTitle}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {conv.lastMessage}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {conv.timestamp.toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
