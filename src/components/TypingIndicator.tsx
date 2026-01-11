export const TypingIndicator = () => {
  return (
    <div 
      className="flex gap-3 mb-6 message-enter"
      role="status"
      aria-label="AI가 응답을 작성 중입니다"
    >
      <div 
        className="w-9 h-9 rounded-xl bg-primary/[0.15] flex items-center justify-center flex-shrink-0 overflow-hidden"
        aria-hidden="true"
      >
        <img src="/avatar-ai.svg" alt="" className="h-9 w-9 object-cover" />
      </div>
      
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-card border border-border">
        <div className="flex items-center gap-1.5 h-5">
          <span 
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" 
            style={{ animationDelay: "0ms", animationDuration: "0.6s" }} 
          />
          <span 
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" 
            style={{ animationDelay: "150ms", animationDuration: "0.6s" }} 
          />
          <span 
            className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" 
            style={{ animationDelay: "300ms", animationDuration: "0.6s" }} 
          />
        </div>
      </div>
    </div>
  );
};
