import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { useCallback, useEffect, useRef, useState } from "react";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";

export interface Insight {
  id: string;
  messageId: string;
  content: string;
  note?: string;
  conversationTitle: string;
  timestamp: Date;
}

interface InsightCardProps {
  insight: Insight;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onNavigate: (messageId: string) => void;
}

export const InsightCard = ({
  insight,
  onDelete,
  onUpdateNote,
  onNavigate,
}: InsightCardProps) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState(insight.note || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const COLLAPSED_MAX_HEIGHT = 168; // ≈7 lines at default line height

  const evaluateOverflow = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const scrollHeight = element.scrollHeight;
    setIsOverflowing(scrollHeight > COLLAPSED_MAX_HEIGHT + 4);
  }, [COLLAPSED_MAX_HEIGHT]);

  useEffect(() => {
    evaluateOverflow();
  }, [insight.content, evaluateOverflow]);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      evaluateOverflow();
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [evaluateOverflow]);

  useEffect(() => {
    setIsExpanded(false);
  }, [insight.id]);

  const handleSaveNote = () => {
    onUpdateNote(insight.id, noteValue);
    setIsEditingNote(false);
  };

  return (
    <Card className="p-4 bg-card border-border hover:border-primary/50 transition-all">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MessageSquare className="h-3 w-3" />
          <span>{insight.conversationTitle}</span>
          <span>•</span>
          <span>{insight.timestamp.toLocaleDateString("ko-KR")}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(insight.id)}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div
        ref={contentRef}
        className={cn(
          "relative mb-3 overflow-hidden transition-[max-height] duration-300 ease-in-out",
          isExpanded ? "max-h-[2000px]" : "max-h-[168px]"
        )}
      >
        <MarkdownRenderer content={insight.content} className="text-sm leading-relaxed text-foreground/90" />
        {!isExpanded && isOverflowing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-card" />
        )}
      </div>

      {isOverflowing && (
        <button
          type="button"
          className="ml-auto mb-3 text-xs font-medium text-primary hover:underline"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? "접기" : "더 보기"}
        </button>
      )}

      {isEditingNote ? (
        <div className="space-y-2">
          <Textarea
            value={noteValue}
            onChange={(e) => setNoteValue(e.target.value)}
            placeholder="이 통찰에 대한 메모를 추가하세요..."
            className="min-h-[80px] text-sm"
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveNote}>
              저장
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsEditingNote(false);
                setNoteValue(insight.note || "");
              }}
            >
              취소
            </Button>
          </div>
        </div>
      ) : (
        <>
          {insight.note && (
            <div className="p-2 bg-accent/10 rounded-lg mb-2">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {insight.note}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingNote(true)}
              className="text-xs"
            >
              {insight.note ? "메모 수정" : "메모 추가"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate(insight.messageId)}
              className="text-xs"
            >
              원본 대화 보기
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
