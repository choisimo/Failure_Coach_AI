import { Suspense, lazy, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useChatStore } from "@/hooks/useChatStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Sparkles, Wand2, ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Chat = lazy(() => import("./pages/Chat"));
const Insights = lazy(() => import("./pages/Insights"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

const queryClient = new QueryClient();

function AppContent() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    addConversation,
  } = useChatStore();

  const navigate = useNavigate();

  const [showNewChat, setShowNewChat] = useState(false);
  const [mode, setMode] = useState<"GUIDED" | "CUSTOM" | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [personaTitle, setPersonaTitle] = useState("");

  const handleNewConversation = () => {
    setMode(null);
    setCustomPrompt("");
    setPersonaTitle("");
    setShowNewChat(true);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    navigate(`/chat/${id}`);
  };

  const startGuided = () => {
    const id = addConversation({ mode: "GUIDED" });
    setActiveConversation(id);
    navigate(`/chat/${id}`);
    setShowNewChat(false);
  };

  const startCustom = () => {
    if (!customPrompt.trim()) return;
    const id = addConversation({ mode: "CUSTOM", customPrompt: customPrompt.trim(), personaTitle: personaTitle.trim() || undefined });
    setActiveConversation(id);
    navigate(`/chat/${id}`);
    setShowNewChat(false);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar
          conversations={conversations}
          activeConversationId={activeConversationId || undefined}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border px-4 bg-background/95 backdrop-blur-sm sticky top-0 z-20">
            <SidebarTrigger aria-label="사이드바 토글" />
          </header>
          <main className="flex-1 flex overflow-hidden">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Chat />} />
                <Route path="/chat/:conversationId" element={<Chat />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>

      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">새 대화 시작</DialogTitle>
            <DialogDescription>
              대화 방식을 선택하세요
            </DialogDescription>
          </DialogHeader>

          {!mode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button 
                onClick={startGuided} 
                className={cn(
                  "group p-5 rounded-2xl border-2 border-border bg-card text-left transition-all duration-200",
                  "hover:border-primary/50 hover:bg-primary/[0.03] hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/[0.12] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">그림자 작업 시작하기</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  실패 경험을 탐색하고 통찰을 얻는 가이드 대화
                </p>
              </button>
              <button 
                onClick={() => setMode("CUSTOM")} 
                className={cn(
                  "group p-5 rounded-2xl border-2 border-border bg-card text-left transition-all duration-200",
                  "hover:border-accent/50 hover:bg-accent/[0.03] hover:shadow-md",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/[0.12] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Wand2 className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-1.5">새 페르소나 만들기</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI 역할을 직접 정의해 대화를 맞춤화합니다
                </p>
              </button>
            </div>
          )}

          {mode === "CUSTOM" && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label htmlFor="persona-title" className="text-sm font-medium text-foreground">
                  페르소나 제목 <span className="text-muted-foreground font-normal">(선택)</span>
                </label>
                <Input
                  id="persona-title"
                  placeholder="예: 친절한 물리학자 / 기술 면접관"
                  value={personaTitle}
                  onChange={(e) => setPersonaTitle(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="system-prompt" className="text-sm font-medium text-foreground">
                  시스템 프롬프트 <span className="text-destructive">*</span>
                </label>
                <Textarea
                  id="system-prompt"
                  rows={6}
                  maxLength={4000}
                  placeholder="예시: 당신은 5살 아이도 이해할 수 있도록 양자역학의 원리를 설명해주는 친절한 물리학자입니다..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="resize-none"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>최대 4000자 권장</span>
                  <span className={cn(customPrompt.length > 3800 && "text-destructive")}>
                    {customPrompt.length.toLocaleString()}/4,000
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  onClick={() => setMode(null)} 
                  variant="ghost"
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  뒤로
                </Button>
                <Button 
                  onClick={startCustom} 
                  disabled={!customPrompt.trim()}
                  className="flex-1"
                >
                  대화 시작
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
