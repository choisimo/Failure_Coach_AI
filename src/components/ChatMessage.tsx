import { Star } from "lucide-react";
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
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <span className="text-primary text-sm font-medium">AI</span>
        </div>
      )}
      
      <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "px-4 py-3 rounded-2xl max-w-[70%] relative group",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border"
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          
          {!isUser && onSave && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity",
                "h-8 w-8 p-0 rounded-full bg-card border border-border shadow-lg",
                message.saved && "opacity-100"
              )}
              onClick={() => onSave(message.id)}
            >
              <Star className={cn("h-4 w-4", message.saved && "fill-accent text-accent")} />
            </Button>
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
