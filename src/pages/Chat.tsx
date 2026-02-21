import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import type { Message } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useChatStore } from "@/hooks/useChatStore";
import { useToast } from "@/hooks/use-toast";
import { requestGatewayCompletion } from "@/lib/aiGateway";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ContentLayout } from "@/components/ContentLayout";
import { useSidebar } from "@/components/ui/sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { MessageSquare, Sparkles } from "lucide-react";

const WELCOME_MESSAGE = `안녕하세요. 저는 '마음 거울'입니다.

저는 당신에게 해결책을 제시하지 않습니다. 대신, 당신의 이야기를 깊이 듣고, 스스로 답을 찾을 수 있도록 질문을 던지는 존재입니다.

이 공간은 당신이 자신의 감정과 생각을 비판 없이 탐색할 수 있는 안전한 곳입니다. 편안하게 당신의 이야기를 들려주세요.

무엇이든 좋습니다. 최근에 겪은 일, 반복되는 고민, 혹은 막연한 불안... 어떤 것이든 환영합니다.`;

export default function Chat() {
  const { conversationId: routeConversationId } = useParams<{ conversationId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const {
    activeConversationId,
    setActiveConversation,
    getActiveMessages,
    addMessage,
    saveInsight,
  } = useChatStore();

  const activeConversation = useChatStore((s) =>
    s.activeConversationId ? s.conversations.find((c) => c.id === s.activeConversationId) : undefined
  );

  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messages = getActiveMessages();
  const [pendingScrollTarget, setPendingScrollTarget] = useState<string | null>(null);
  const highlightTimeoutRef = useRef<number | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false);
  }, [messages.length]);

  useEffect(() => {
    if (routeConversationId && routeConversationId !== activeConversationId) {
      setActiveConversation(routeConversationId);
    } else if (!routeConversationId && activeConversationId) {
      navigate(`/chat/${activeConversationId}`, { replace: true });
    }
  }, [routeConversationId, activeConversationId, setActiveConversation, navigate]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!location.hash) return;
    if (!location.hash.startsWith("#message-")) return;
    const targetId = location.hash.replace("#message-", "");
    setPendingScrollTarget(targetId);
  }, [location.hash]);

  useEffect(() => {
    if (!pendingScrollTarget) return;
    const exists = messages.some((m) => m.id === pendingScrollTarget);
    if (!exists) return;

    const element = document.getElementById(`message-${pendingScrollTarget}`);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedMessageId(pendingScrollTarget);
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = window.setTimeout(() => {
      setHighlightedMessageId(null);
      highlightTimeoutRef.current = null;
    }, 2500);
    setPendingScrollTarget(null);
  }, [pendingScrollTarget, messages]);

  useEffect(() => () => {
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (activeConversation?.mode === "CUSTOM") setShowWelcome(false);
  }, [activeConversation?.mode]);

  const handleSend = async (content: string) => {
    if (!activeConversationId) return;

    setShowWelcome(false);
    addMessage(activeConversationId, { role: "user", content });
    setIsTyping(true);

    const history = [
      ...messages.map((message) => ({ role: message.role, content: message.content })),
      { role: "user" as const, content },
    ];

    try {
      const { reply } = await requestGatewayCompletion({
        messages: history,
        metadata: {
          sessionMode: activeConversation?.mode,
          customSystemPrompt: activeConversation?.customPrompt,
          personaTitle: activeConversation?.personaTitle,
        },
      });

      addMessage(activeConversationId, { role: "assistant", content: reply });
    } catch (error) {
      console.error(error);
      toast({
        title: "응답을 불러오지 못했어요",
        description: "잠시 후 다시 시도해 주세요.",
        variant: "destructive",
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveInsight = (messageId: string) => {
    if (!activeConversationId) return;
    saveInsight(activeConversationId, messageId);

    const message = messages.find((m) => m.id === messageId);
    if (message?.saved) {
      toast({ title: "저장 취소됨", description: "통찰이 삭제되었습니다." });
    } else {
      toast({ title: "통찰 저장됨", description: "나의 통찰 페이지에서 확인하실 수 있습니다." });
    }
  };

  const handleCopy = async (messageId: string) => {
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    try {
      await navigator.clipboard.writeText(msg.content);
      toast({ title: "복사됨", description: "메시지가 클립보드에 복사되었습니다." });
    } catch {
      toast({ title: "복사 실패", description: "복사 권한을 확인해주세요.", variant: "destructive" });
    }
  };

  const handleLikeToggle = (messageId: string) => {
    if (!activeConversationId) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    useChatStore.getState().updateMessage(activeConversationId, messageId, { liked: !msg.liked });
  };

  const handleRegenerate = async (assistantMessageId: string) => {
    if (!activeConversationId || isTyping) return;
    const list = messages;
    const idx = list.findIndex((m) => m.id === assistantMessageId);
    if (idx === -1) return;

    const hasUserBefore = list.slice(0, idx).some((m) => m.role === "user");
    if (!hasUserBefore) return;

    setIsTyping(true);

    const slice = list.slice(0, idx);
    const history = slice.map((m) => ({ role: m.role, content: m.content })) as Array<{
      role: Message["role"]; content: string;
    }>;

    try {
      const { reply } = await requestGatewayCompletion({
        messages: history,
        metadata: {
          sessionMode: activeConversation?.mode,
          customSystemPrompt: activeConversation?.customPrompt,
          personaTitle: activeConversation?.personaTitle,
        },
      });

      useChatStore.getState().updateMessage(activeConversationId, assistantMessageId, { content: reply });
      toast({ title: "재생성 완료", description: "응답이 새로 고쳐졌습니다." });
    } catch (error) {
      console.error(error);
      toast({ title: "재생성 실패", description: "다시 시도해 주세요.", variant: "destructive" });
    } finally {
      setIsTyping(false);
    }
  };

  const { state, isMobile } = useSidebar();
  const isSidebarExpanded = state === "expanded";
  const layoutPadding = cn(
    "transition-[padding] duration-300",
    !isMobile && isSidebarExpanded ? "lg:pl-8 xl:pl-12" : !isMobile ? "lg:pl-6" : ""
  );

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
            <MessageSquare className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-foreground">대화를 시작해보세요</h2>
          <p className="text-muted-foreground leading-relaxed">
            새로운 대화를 시작하거나<br />
            사이드바에서 이전 대화를 선택해주세요.
          </p>
        </div>
      </div>
    );
  }

  const isCustom = activeConversation?.mode === "CUSTOM";

  return (
    <div className="flex-1 flex flex-col h-full">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <ContentLayout className={cn(layoutPadding, "py-4")}> 
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-foreground">대화</h1>
            {isCustom && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="font-medium">
                    {activeConversation?.personaTitle || "커스텀 세션"}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-md">
                  <p className="text-xs whitespace-pre-wrap leading-relaxed">
                    {activeConversation?.customPrompt || "사용자 정의 프롬프트가 제공되지 않았습니다."}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </ContentLayout>
      </header>

      <ScrollArea className="flex-1">
        <ContentLayout className={cn(layoutPadding, "py-6")}>
          {showWelcome && !isCustom && messages.length === 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-card to-card/80 border border-border shadow-sm animate-fade-in">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/[0.15] flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-foreground mb-3">
                    마음 거울에 오신 것을 환영합니다
                  </h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                    {WELCOME_MESSAGE}
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              highlighted={message.id === highlightedMessageId}
              onSave={handleSaveInsight}
              onCopy={handleCopy}
              onLikeToggle={handleLikeToggle}
              onRegenerate={handleRegenerate}
            />
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={scrollRef} />
        </ContentLayout>
      </ScrollArea>

      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
