import { InsightCard } from "@/components/InsightCard";
import { ContentLayout } from "@/components/ContentLayout";
import { useSidebar } from "@/components/ui/sidebar";
import { useChatStore } from "@/hooks/useChatStore";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Star, Sparkles } from "lucide-react";

export default function Insights() {
  const { insights, deleteInsight, updateInsightNote } = useChatStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state, isMobile } = useSidebar();

  const isSidebarExpanded = state === "expanded";
  const layoutPadding = cn(
    "transition-[padding] duration-300",
    !isMobile && isSidebarExpanded ? "lg:pl-8 xl:pl-12" : !isMobile ? "lg:pl-6" : ""
  );

  const handleNavigateToMessage = (conversationId: string | undefined, messageId: string) => {
    if (!conversationId) {
      toast({
        title: "대화를 찾을 수 없어요",
        description: "대화 정보가 없어 홈으로 이동합니다.",
      });
      navigate("/");
      return;
    }

    navigate(`/chat/${conversationId}#message-${messageId}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <ContentLayout className={cn(layoutPadding, "py-6")}>
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl bg-accent/[0.15] flex items-center justify-center"
              aria-hidden="true"
            >
              <Star className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">나의 통찰</h1>
              <p className="text-sm text-muted-foreground">
                저장한 의미 있는 순간들을 모아보세요
              </p>
            </div>
          </div>
        </ContentLayout>
      </header>

      <main className="flex-1 overflow-y-auto">
        <ContentLayout className={cn(layoutPadding, "py-6")}>
          {insights.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center px-4">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-primary/10 shadow-lg shadow-accent/10">
                <Sparkles className="h-9 w-9 text-accent" />
              </div>
              <h2 className="mb-3 text-2xl font-semibold text-foreground">
                아직 저장된 통찰이 없습니다
              </h2>
              <p className="text-muted-foreground max-w-md leading-relaxed">
                대화 중 의미 있는 AI의 답변에 별표를 눌러 저장해보세요.
                <br />
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
        </ContentLayout>
      </main>
    </div>
  );
}
