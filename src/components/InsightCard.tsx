import { MessageSquare, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { useState } from "react";

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

      <p className="text-sm leading-relaxed mb-3 text-foreground/90">
        {insight.content}
      </p>

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
