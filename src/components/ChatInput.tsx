import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 160);
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = input.trim().length > 0 && !disabled;

  return (
    <div className="border-t border-border bg-gradient-to-t from-background to-background/95 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto p-4">
        <div 
          className={cn(
            "flex items-end gap-3 p-2 rounded-2xl border bg-card transition-all duration-200",
            disabled ? "border-border/50 opacity-60" : "border-border hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="당신의 이야기를 들려주세요..."
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-3 py-2.5 text-sm leading-relaxed",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none",
              "disabled:cursor-not-allowed",
              "min-h-[44px] max-h-[160px]"
            )}
            aria-label="메시지 입력"
          />
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            className={cn(
              "h-10 w-10 rounded-xl flex-shrink-0 transition-all duration-200",
              canSend 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md" 
                : "bg-muted text-muted-foreground"
            )}
            aria-label="메시지 보내기"
          >
            <Send className={cn("h-4 w-4 transition-transform", canSend && "group-hover:translate-x-0.5")} />
          </Button>
        </div>
        <p className="mt-2 text-center text-[11px] text-muted-foreground/50">
          Enter로 전송 · Shift+Enter로 줄바꿈
        </p>
      </div>
    </div>
  );
};
