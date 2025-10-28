import { useState, KeyboardEvent } from "react";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput = ({ onSend, disabled }: ChatInputProps) => {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
      <div className="flex gap-2 max-w-4xl mx-auto">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="당신의 이야기를 들려주세요..."
          disabled={disabled}
          className="min-h-[60px] max-h-[200px] resize-none bg-background border-border focus-visible:ring-primary"
          rows={2}
        />
        <Button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          size="lg"
          className="h-auto px-6 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
