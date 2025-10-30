import { InsightCard } from "@/components/InsightCard";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatStore } from "@/hooks/useChatStore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";

export default function Insights() {
  const { insights, deleteInsight, updateInsightNote } = useChatStore();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();

  const isSidebarExpanded = state === "expanded";
  const containerClass = cn(
    "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 transition-[padding] duration-300",
    !isMobile && isSidebarExpanded ? "lg:pl-12 xl:pl-16" : !isMobile ? "lg:pl-10" : ""
  );
  const sectionClass = cn(containerClass, "py-6");

  const handleNavigateToMessage = (messageId: string) => {
    // In a real app, this would scroll to the specific message
    navigate("/");
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="border-b border-border bg-background/95">
        <div className={sectionClass}>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold">나의 통찰</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">저장한 의미 있는 순간들을 모아보세요</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={sectionClass}>
          {insights.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <h2 className="mb-2 text-xl font-semibold">아직 저장된 통찰이 없습니다</h2>
              <p className="text-muted-foreground">
                대화 중 의미 있는 AI의 답변에 별표를 눌러 저장해보세요.
                나중에 여기서 다시 볼 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
    </div>
  );
}
