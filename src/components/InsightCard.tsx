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
  conversationId?: string;
  content: string;
  note?: string;
  conversationTitle: string;
  timestamp: Date;
}

interface InsightCardProps {
  insight: Insight;
  onDelete: (id: string) => void;
  onUpdateNote: (id: string, note: string) => void;
  onNavigate: (conversationId: string | undefined, messageId: string) => void;
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

  const COLLAPSED_CARD_HEIGHT = 320;
  const EXPANDED_CARD_HEIGHT = 520;
  const COLLAPSED_CONTENT_MAX_HEIGHT = 148;
  const EXPANDED_CONTENT_MAX_HEIGHT = 360;
  const GRADIENT_HEIGHT = 72;

  const cardHeight = isExpanded ? EXPANDED_CARD_HEIGHT : COLLAPSED_CARD_HEIGHT;
  const contentMaxHeight = isExpanded ? EXPANDED_CONTENT_MAX_HEIGHT : COLLAPSED_CONTENT_MAX_HEIGHT;

  const evaluateOverflow = useCallback(() => {
    const element = contentRef.current;
    if (!element) return;

    const scrollHeight = element.scrollHeight;
    setIsOverflowing(scrollHeight > COLLAPSED_CONTENT_MAX_HEIGHT + 4);
  }, [COLLAPSED_CONTENT_MAX_HEIGHT]);

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
    <Card
      style={{ height: cardHeight }}
      className={cn(
        "flex flex-col p-4 bg-card border-border hover:border-primary/50 transition-all",
        !isExpanded && "overflow-hidden"
      )}
    >
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

      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="relative flex-1 overflow-hidden rounded-xl border border-border/40 bg-card/60">
          <div
            ref={contentRef}
            className={cn(
              "thin-scrollbar h-full",
              isExpanded ? "overflow-y-auto pr-1" : "overflow-hidden"
            )}
            style={{ maxHeight: contentMaxHeight }}
          >
            <div className="p-3">
              <MarkdownRenderer content={insight.content} className="text-sm leading-relaxed text-foreground/90" />
            </div>
          </div>
          {!isExpanded && isOverflowing && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent via-card/60 to-card"
              style={{ height: GRADIENT_HEIGHT }}
            />
          )}
        </div>

        {isOverflowing && (
          <button
            type="button"
            className="ml-auto text-xs font-medium text-primary hover:underline"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "접기" : "더 보기"}
          </button>
        )}

        <div className="border-t border-border/40 pt-3 mt-1 flex flex-1 flex-col gap-3">
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
              <Button variant="outline" size="sm" onClick={() => setIsEditingNote(false)}>
                취소
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {insight.note ? (
              <div className="rounded-lg bg-muted/10 p-3 text-sm text-muted-foreground">
                <p className="whitespace-pre-wrap">{insight.note}</p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">메모가 없습니다. 필요한 참고 사항을 저장해보세요.</p>
            )}
          </div>
        )}

          <div className="mt-auto flex flex-wrap gap-2 justify-end">
            {isEditingNote ? null : (
              <Button variant="secondary" size="sm" onClick={() => setIsEditingNote(true)}>
                {insight.note ? "메모 수정" : "메모 추가"}
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => onNavigate(insight.conversationId, insight.messageId)}>
              원본 대화 보기
            </Button>
            {!isEditingNote && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive/80" onClick={() => onDelete(insight.id)}>
                삭제
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
