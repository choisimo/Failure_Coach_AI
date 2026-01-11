import { useState } from "react";
import { MessageSquare, Trash2, Edit3, ExternalLink } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
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

  const handleSaveNote = () => {
    onUpdateNote(insight.id, noteValue);
    setIsEditingNote(false);
  };

  const handleCancelEdit = () => {
    setNoteValue(insight.note || "");
    setIsEditingNote(false);
  };

  return (
    <Card className="flex flex-col bg-card border-border hover:border-primary/30 transition-all duration-200 overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
          <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
          <span className="truncate font-medium">{insight.conversationTitle}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={insight.timestamp.toISOString()} className="flex-shrink-0">
            {insight.timestamp.toLocaleDateString("ko-KR", { 
              year: "numeric",
              month: "short", 
              day: "numeric" 
            })}
          </time>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(insight.id)}
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg flex-shrink-0"
          aria-label="통찰 삭제"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative">
          <div
            className={cn(
              "rounded-xl border border-border/40 bg-muted/20 overflow-hidden transition-all duration-300",
              !isExpanded && "max-h-36"
            )}
          >
            <div className="p-4">
              <MarkdownRenderer 
                content={insight.content} 
                className="text-sm leading-relaxed text-foreground/90" 
              />
            </div>
          </div>
          
          {!isExpanded && (
            <div 
              className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none"
              aria-hidden="true"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          aria-expanded={isExpanded}
        >
          {isExpanded ? "접기" : "더 보기"}
        </button>

        <div className="pt-3 border-t border-border/40">
          {isEditingNote ? (
            <div className="space-y-3">
              <Textarea
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value)}
                placeholder="이 통찰에 대한 메모를 추가하세요..."
                className="min-h-[100px] text-sm resize-none"
                aria-label="메모 입력"
              />
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCancelEdit}
                  className="h-8"
                >
                  취소
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveNote}
                  className="h-8"
                >
                  저장
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {insight.note ? (
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                    {insight.note}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-2">
                  메모가 없습니다. 중요한 참고 사항을 기록해보세요.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-4 pt-0 mt-auto">
        {!isEditingNote && (
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => setIsEditingNote(true)}
            className="h-8 rounded-lg"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
            {insight.note ? "메모 수정" : "메모 추가"}
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onNavigate(insight.conversationId, insight.messageId)}
          className="h-8 rounded-lg"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
          원본 보기
        </Button>
      </div>
    </Card>
  );
};
