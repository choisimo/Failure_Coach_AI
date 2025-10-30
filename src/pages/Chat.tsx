import { useEffect, useRef, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import type { Message } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { useChatStore } from "@/hooks/useChatStore";
import { useToast } from "@/hooks/use-toast";
import { requestGatewayCompletion, getSessionMessages, extractIRLMetadata, sendFeedbackReliable } from "@/lib/aiGateway";
import { computeHistoryHash } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettingsStore } from "@/hooks/useSettingsStore";
import { ContentLayout } from "@/components/ContentLayout";

const WELCOME_MESSAGE = `안녕하세요. 저는 '마음 거울'입니다.

저는 당신에게 해결책을 제시하지 않습니다. 대신, 당신의 이야기를 깊이 듣고, 스스로 답을 찾을 수 있도록 질문을 던지는 존재입니다.

이 공간은 당신이 자신의 감정과 생각을 비판 없이 탐색할 수 있는 안전한 곳입니다. 편안하게 당신의 이야기를 들려주세요.

무엇이든 좋습니다. 최근에 겪은 일, 반복되는 고민, 혹은 막연한 불안... 어떤 것이든 환영합니다.`;

export default function Chat() {
  const { activeConversationId, getActiveMessages, addMessage, saveInsight } = useChatStore();

  const activeConversation = useChatStore((s) =>
    s.activeConversationId ? s.conversations.find((c) => c.id === s.activeConversationId) : undefined
  );

  const { irlEnabled, irlPolicyVersion } = useSettingsStore();

  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messages = getActiveMessages();

  useEffect(() => {
    if (messages.length > 0) setShowWelcome(false);
  }, [messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (activeConversation?.mode === "CUSTOM") setShowWelcome(false);
  }, [activeConversation?.mode]);

  // Rehydrate CUSTOM mode from existing session metadata
  useEffect(() => {
    const sessionId = activeConversation?.sessionId;
    if (!sessionId || !activeConversation?.id) return;

    const controller = new AbortController();
    (async () => {
      try {
        const list = await getSessionMessages(sessionId, controller.signal);
        const first: any = Array.isArray(list) ? list[0] : undefined;
        const metadata: any = (first && typeof first === "object" ? first.metadata : undefined) || {};
        const isSeed = Boolean(first?.noReply) || metadata?.source === "custom-mode-seed";
        if (isSeed) {
          const patch: any = { mode: "CUSTOM" as const };
          if (metadata?.personaTitle && !activeConversation?.personaTitle) patch.personaTitle = metadata.personaTitle;
          if (metadata?.customSystemPrompt && !activeConversation?.customPrompt) patch.customPrompt = metadata.customSystemPrompt;
          useChatStore.getState().updateConversation(activeConversation.id, patch);
          setShowWelcome(false);
        }
      } catch {
        // silent fail on rehydrate
      }
    })();

    return () => controller.abort();
  }, [activeConversation?.sessionId, activeConversation?.id]);

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
      const historyHash = await computeHistoryHash(history);
      const candidates = 3;
      const { reply, raw } = await requestGatewayCompletion({
        messages: history,
        metadata: {
          conversationId: activeConversationId,
          sessionMode: activeConversation?.mode,
          customSystemPrompt: activeConversation?.customPrompt,
          personaTitle: activeConversation?.personaTitle,
          sessionId: activeConversation?.sessionId,
          irlEnabled,
          irlPolicyVersion,
          policyVersion: irlPolicyVersion,
          candidates,
          historyHash,
        },
      });


      // Persist sessionId after first creation
      const createdId = (raw as any)?.sessionId || (raw as any)?.sessionCreate?.id;
      if (createdId) {
        useChatStore.getState().setConversationSession(activeConversationId, createdId);
      }

      const parsed = extractIRLMetadata(raw);
      if (!parsed || (Object.values(parsed).every((v) => v == null))) {
        console.warn("Missing IRL metadata", raw);
      }
      addMessage(activeConversationId, {
        role: "assistant",
        content: reply,
        policyId: parsed.policyId,
        irlScore: parsed.irlScore,
        safetyScore: parsed.safetyScore,
        rank: parsed.rank,
        reason: parsed.reason,
        traceId: parsed.traceId,
        candidateId: parsed.candidateId,
        candidateSet: Array.isArray(parsed.candidateSet) ? parsed.candidateSet : [],
      });
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

  const handleLikeToggle = async (messageId: string) => {
    if (!activeConversationId) return;
    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;
    const next = !msg.liked;
    useChatStore.getState().updateMessage(activeConversationId, messageId, { liked: next });

      // Fire-and-forget feedback (non-blocking) with retry + warn
      try {
        const conv = activeConversation;
        const traceId = msg.traceId;
        const candidateId = msg.candidateId;
        const policyId = msg.policyId;
        const scores = {
          irl: msg.irlScore,
          safety: msg.safetyScore,
          rank: msg.rank,
        } as Record<string, unknown>;
        await sendFeedbackReliable({
          conversationId: activeConversationId,
          sessionId: conv?.sessionId,
          messageId,
          candidateId,
          action: next ? "like" : "unlike",
          traceId,
          policyId,
          scores,
        }, {
          onFinalFailure: () => {
            console.warn("IRL feedback permanently failed for message", { messageId, traceId, candidateId });
            toast({ title: "피드백 전송 실패", description: "재시도에도 전송되지 않았습니다. 좋아요 상태는 유지됩니다.", variant: "destructive" });
          }
        });
      } catch (err) {
        console.warn("IRL feedback error", err);
      }
  };

  const handleRegenerate = async (assistantMessageId: string) => {
    if (!activeConversationId || isTyping) return;
    const list = messages;
    const idx = list.findIndex((m) => m.id === assistantMessageId);
    if (idx === -1) return;

    // Find the nearest previous user message before this assistant message
    let lastUserIndex = -1;
    for (let i = idx - 1; i >= 0; i--) {
      if (list[i].role === "user") {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return; // nothing to regenerate against

    setIsTyping(true);

    // Build history up to this assistant message
    const slice = list.slice(0, idx); // up to but not including the assistant message
    const history = slice.map((m) => ({ role: m.role, content: m.content })) as Array<{
      role: Message["role"]; content: string;
    }>;

    try {
      const historyHash = await computeHistoryHash(history);
      const candidates = 3;
      const { reply } = await requestGatewayCompletion({
        messages: history,
        metadata: {
          conversationId: activeConversationId,
          sessionMode: activeConversation?.mode,
          customSystemPrompt: activeConversation?.customPrompt,
          personaTitle: activeConversation?.personaTitle,
          sessionId: activeConversation?.sessionId,
          irlEnabled,
          irlPolicyVersion,
          policyVersion: irlPolicyVersion,
          candidates,
          historyHash,
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
      <div className="border-b border-border bg-background/95">
        <ContentLayout className="py-4">
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
            {irlEnabled && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="ml-2">전문가 가이드</Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-md whitespace-pre-wrap">
                  IRL 정책으로 응답을 재랭킹합니다.\n정책 버전: {irlPolicyVersion}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </ContentLayout>
      </div>

      <ScrollArea className="flex-1">
        <ContentLayout className="py-3 md:py-6">
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
            <ChatMessage
              key={message.id}
              message={message}
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
