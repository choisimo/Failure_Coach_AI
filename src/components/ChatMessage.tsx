import { Copy, Heart, RefreshCw, Star } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  saved?: boolean;
}

interface ChatMessageProps {
  message: Message;
  onSave?: (messageId: string) => void;
}

export const ChatMessage = ({ message, onSave }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 mb-4 message-enter",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/avatar-ai.svg" alt="AI" className="h-8 w-8 object-cover" />
        </div>
      )}
      
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl max-w-[70%] relative group",
            isUser
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card border border-border shadow-sm"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

          {/* Hover actions */}
          {!isUser && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button aria-label="복사" variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card border border-border">
                <Copy className="h-4 w-4" />
              </Button>
              <Button aria-label="좋아요" variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card border border-border">
                <Heart className="h-4 w-4" />
              </Button>
              <Button aria-label="재생성" variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card border border-border">
                <RefreshCw className="h-4 w-4" />
              </Button>
              {onSave && (
                <Button
                  aria-label={message.saved ? "통찰 제거" : "통찰 저장"}
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 rounded-full bg-card border border-border",
                    message.saved && "ring-1 ring-accent"
                  )}
                  onClick={() => onSave(message.id)}
                >
                  <Star className={cn("h-4 w-4", message.saved && "fill-accent text-accent")} />
                </Button>
              )}
            </div>
          )}
        </div>
        
        <span className="text-xs text-muted-foreground px-2">
          {message.timestamp.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
          <span className="text-accent text-sm font-medium">나</span>
        </div>
      )}
    </div>
  );
};
