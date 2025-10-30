import { Copy, Heart, RefreshCw, Star } from "lucide-react";
import { Button } from "./ui/button";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  saved?: boolean;
  liked?: boolean;
  // IRL/Policy metadata (assistant messages)
  policyId?: string;
  irlScore?: number;
  safetyScore?: number;
  rank?: number;
  reason?: string;
  traceId?: string;
  candidateId?: string;
  candidateSet?: any[];
}

interface ChatMessageProps {
  message: Message;
  onSave?: (messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onLikeToggle?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

export const ChatMessage = ({ message, onSave, onCopy, onLikeToggle, onRegenerate }: ChatMessageProps) => {
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
          {/* Policy/IRL badges */}
          {!isUser && (message.policyId || message.irlScore != null || message.safetyScore != null) && (
            <div className="mb-1 -mt-1 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground/80">
              {message.policyId && (
                <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">policy: {message.policyId}</span>
              )}
              {message.irlScore != null && (
                <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">irl: {message.irlScore?.toFixed?.(2) ?? message.irlScore}</span>
              )}
              {message.safetyScore != null && (
                <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">safety: {message.safetyScore?.toFixed?.(2) ?? message.safetyScore}</span>
              )}
              {message.rank != null && (
                <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">rank: {message.rank}</span>
              )}
              {message.traceId && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border cursor-help">trace: {String(message.traceId).slice(0,8)}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start" className="max-w-md whitespace-pre-wrap">
                    <div className="text-xs">
                      <div><strong>Trace ID:</strong> {String(message.traceId)}</div>
                      {message.reason && <div className="mt-1"><strong>Reason:</strong> {String(message.reason)}</div>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}

          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}


          {/* Hover actions */}
          {!isUser && (
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
              <Button aria-label="복사" variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card border border-border" onClick={() => onCopy?.(message.id)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button aria-label="좋아요" variant="ghost" size="icon" className={cn("h-8 w-8 rounded-full bg-card border border-border", message.liked && "ring-1 ring-primary/40")} onClick={() => onLikeToggle?.(message.id)}>
                <Heart className={cn("h-4 w-4", message.liked && "fill-primary text-primary")} />
              </Button>
              <Button aria-label="재생성" variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-card border border-border" onClick={() => onRegenerate?.(message.id)}>
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

