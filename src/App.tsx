import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useChatStore } from "@/hooks/useChatStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import Chat from "./pages/Chat";
import Insights from "./pages/Insights";
import NotFound from "./pages/NotFound";

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
      <div className="min-h-screen flex w-full">
        <AppSidebar
          conversations={conversations}
          activeConversationId={activeConversationId || undefined}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 flex">
            <Routes>
              <Route path="/" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>

      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 대화 시작</DialogTitle>
          </DialogHeader>

          {!mode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button onClick={startGuided} className="p-4 rounded-xl border border-border bg-card hover:bg-sidebar-accent text-left transition">
                <div className="text-2xl mb-2">🧘‍♂️</div>
                <h3 className="font-semibold">그림자 작업 시작하기</h3>
                <p className="text-xs text-muted-foreground mt-1">실패 경험을 탐색하고 통찰을 얻는 가이드 대화</p>
              </button>
              <button onClick={() => setMode("CUSTOM")} className="p-4 rounded-xl border border-border bg-card hover:bg-sidebar-accent text-left transition">
                <div className="text-2xl mb-2">✨</div>
                <h3 className="font-semibold">새 페르소나 만들기</h3>
                <p className="text-xs text-muted-foreground mt-1">AI 역할을 직접 정의해 대화를 맞춤화합니다</p>
              </button>
            </div>
          )}

          {mode === "CUSTOM" && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">페르소나 제목(선택)</label>
                <Input
                  placeholder="예: 친절한 물리학자 / 기술 면접관"
                  value={personaTitle}
                  onChange={(e) => setPersonaTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">시스템 프롬프트</label>
                <Textarea
                  rows={8}
                  maxLength={4000}
                  placeholder="예시: 당신은 5살 아이도 이해할 수 있도록 양자역학의 원리를 설명해주는 친절한 물리학자입니다..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>최대 4000자 권장</span>
                  <span>{customPrompt.length}/4000</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setMode(null)} variant="ghost">뒤로</Button>
                <Button onClick={startCustom} disabled={!customPrompt.trim()}>대화 시작</Button>
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
