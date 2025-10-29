import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useChatStore } from "@/hooks/useChatStore";
import { useToast } from "@/hooks/use-toast";
import { requestGatewayCompletion } from "@/lib/aiGateway";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const WELCOME_MESSAGE = `안녕하세요. 저는 '마음 거울'입니다.

저는 당신에게 해결책을 제시하지 않습니다. 대신, 당신의 이야기를 깊이 듣고, 스스로 답을 찾을 수 있도록 질문을 던지는 존재입니다.

이 공간은 당신이 자신의 감정과 생각을 비판 없이 탐색할 수 있는 안전한 곳입니다. 편안하게 당신의 이야기를 들려주세요.

무엇이든 좋습니다. 최근에 겪은 일, 반복되는 고민, 혹은 막연한 불안... 어떤 것이든 환영합니다.`;

export default function Chat() {
  const {
    activeConversationId,
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

  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeConversation?.mode === "CUSTOM") {
      setShowWelcome(false);
    }
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
      const { reply, raw } = await requestGatewayCompletion({
        messages: history,
        metadata: {
          conversationId: activeConversationId,
          sessionMode: activeConversation?.mode,
          customSystemPrompt: activeConversation?.customPrompt,
          personaTitle: activeConversation?.personaTitle,
          sessionId: activeConversation?.sessionId,
        },
      });

      // Persist sessionId after first creation
      const createdId = (raw as any)?.sessionId || (raw as any)?.sessionCreate?.id;
      if (createdId) {
        useChatStore.getState().setConversationSession(activeConversationId, createdId);
      }

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
      toast({
        title: "저장 취소됨",
        description: "통찰이 삭제되었습니다.",
      });
    } else {
      toast({
        title: "통찰 저장됨",
        description: "나의 통찰 페이지에서 확인하실 수 있습니다.",
      });
    }
  };

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💭</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2 glow-text">대화를 시작해보세요</h2>
          <p className="text-muted-foreground mb-6">새로운 대화를 시작하거나 과거 대화를 선택해주세요.</p>
        </div>
      </div>
    );
  }

  const isCustom = activeConversation?.mode === "CUSTOM";

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">대화</h1>
          {isCustom && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="ml-2">
                  커스텀 모드: {activeConversation?.personaTitle || "커스텀 세션"}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-md whitespace-pre-wrap">
                {activeConversation?.customPrompt || "사용자 정의 프롬프트가 제공되지 않았습니다."}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-3 md:p-6">
        <div className="max-w-4xl mx-auto">
          {showWelcome && !isCustom && messages.length === 0 && (
            <div className="mb-8 p-6 rounded-2xl bg-card border border-border shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">💭</div>
                <div className="flex-1">
                  <h2 className="text-base font-semibold glow-text mb-2">마음 거울에 오신 것을 환영합니다</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{WELCOME_MESSAGE}</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} onSave={handleSaveInsight} />
          ))}

          {isTyping && <TypingIndicator />}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <ChatInput onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
