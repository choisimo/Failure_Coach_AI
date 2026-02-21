import { useState, lazy, Suspense } from "react";
import { Copy, Heart, RefreshCw, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";
const MarkdownRenderer = lazy(() => import("@/components/MarkdownRenderer"));
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  saved?: boolean;
  liked?: boolean;
  policyId?: string;
  irlScore?: number;
  safetyScore?: number;
  rank?: number;
  reason?: string;
  traceId?: string;
  candidateId?: string;
  candidateSet?: unknown[];
}

interface ChatMessageProps {
  message: Message;
  highlighted?: boolean;
  onSave?: (messageId: string) => void;
  onCopy?: (messageId: string) => void;
  onLikeToggle?: (messageId: string) => void;
  onRegenerate?: (messageId: string) => void;
}

const isDev = import.meta.env.DEV;

export const ChatMessage = ({ message, highlighted, onSave, onCopy, onLikeToggle, onRegenerate }: ChatMessageProps) => {
  const isUser = message.role === "user";
  const [showDebug, setShowDebug] = useState(false);
  const hasDebugInfo = message.policyId || message.irlScore != null || message.safetyScore != null;

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        "group/message flex gap-3 mb-6 message-enter",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div 
          className="w-9 h-9 rounded-xl bg-primary/[0.15] flex items-center justify-center flex-shrink-0 overflow-hidden"
          aria-hidden="true"
        >
          <img src="/avatar-ai.svg" alt="" className="h-9 w-9 object-cover" />
        </div>
      )}
      
      <div className={cn("flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] lg:max-w-[70%]", isUser ? "items-end" : "items-start")}> 
        <div
          className={cn(
            "relative px-4 py-3 rounded-2xl transition-all duration-200",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md",
            highlighted && "ring-2 ring-primary/50 shadow-lg shadow-primary/10"
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Suspense fallback={<p className="text-sm leading-relaxed text-muted-foreground animate-pulse">{message.content}</p>}>
              <MarkdownRenderer content={message.content} />
            </Suspense>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity duration-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  aria-label="메시지 복사" 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                  onClick={() => onCopy?.(message.id)}
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">복사</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  aria-label={message.liked ? "좋아요 취소" : "좋아요"} 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    "h-7 w-7 p-0 rounded-lg hover:bg-muted",
                    message.liked && "bg-primary/10"
                  )}
                  onClick={() => onLikeToggle?.(message.id)}
                >
                  <Heart className={cn(
                    "h-3.5 w-3.5",
                    message.liked ? "fill-primary text-primary" : "text-muted-foreground"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {message.liked ? "좋아요 취소" : "좋아요"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  aria-label="응답 재생성" 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0 rounded-lg hover:bg-muted"
                  onClick={() => onRegenerate?.(message.id)}
                >
                  <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">재생성</TooltipContent>
            </Tooltip>

            {onSave && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={message.saved ? "통찰 저장 취소" : "통찰로 저장"}
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-7 w-7 p-0 rounded-lg hover:bg-muted",
                      message.saved && "bg-accent/10"
                    )}
                    onClick={() => onSave(message.id)}
                  >
                    <Star className={cn(
                      "h-3.5 w-3.5",
                      message.saved ? "fill-accent text-accent" : "text-muted-foreground"
                    )} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {message.saved ? "저장 취소" : "통찰 저장"}
                </TooltipContent>
              </Tooltip>
            )}

            {isDev && hasDebugInfo && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label="디버그 정보 토글"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg hover:bg-muted ml-1"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    {showDebug ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">디버그 정보</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {isDev && !isUser && showDebug && hasDebugInfo && (
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground/80 p-2 rounded-lg bg-muted/30 border border-border/50">
            {message.policyId && (
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">
                policy: {message.policyId}
              </span>
            )}
            {message.irlScore != null && (
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">
                irl: {message.irlScore?.toFixed?.(2) ?? message.irlScore}
              </span>
            )}
            {message.safetyScore != null && (
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">
                safety: {message.safetyScore?.toFixed?.(2) ?? message.safetyScore}
              </span>
            )}
            {message.rank != null && (
              <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border">
                rank: {message.rank}
              </span>
            )}
            {message.traceId && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="px-1.5 py-0.5 rounded bg-muted/60 border border-border cursor-help">
                    trace: {String(message.traceId).slice(0, 8)}...
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-md">
                  <div className="text-xs space-y-1">
                    <div><strong>Trace ID:</strong> {String(message.traceId)}</div>
                    {message.reason && <div><strong>Reason:</strong> {String(message.reason)}</div>}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        <time 
          className="text-[11px] text-muted-foreground/70 px-1"
          dateTime={message.timestamp.toISOString()}
        >
          {message.timestamp.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>

      {isUser && (
        <div 
          className="w-9 h-9 rounded-xl bg-accent/[0.15] flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <span className="text-accent text-sm font-semibold">나</span>
        </div>
      )}
    </div>
  );
};
