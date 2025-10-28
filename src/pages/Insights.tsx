import { InsightCard } from "@/components/InsightCard";
import { useChatStore } from "@/hooks/useChatStore";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

export default function Insights() {
  const { insights, deleteInsight, updateInsightNote } = useChatStore();
  const navigate = useNavigate();

  const handleNavigateToMessage = (messageId: string) => {
    // In a real app, this would scroll to the specific message
    navigate("/");
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">나의 통찰</h1>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          저장한 의미 있는 순간들을 모아보세요
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {insights.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <h2 className="text-xl font-semibold mb-2">아직 저장된 통찰이 없습니다</h2>
              <p className="text-muted-foreground">
                대화 중 의미 있는 AI의 답변에 별표를 눌러 저장해보세요.
                나중에 여기서 다시 볼 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
            {insights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDelete={deleteInsight}
                onUpdateNote={updateInsightNote}
                onNavigate={handleNavigateToMessage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
