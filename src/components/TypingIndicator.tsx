export const TypingIndicator = () => {
  return (
    <div className="flex gap-3 mb-4 message-enter">
      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <span className="text-primary text-sm font-medium">AI</span>
      </div>
      
      <div className="px-4 py-3 rounded-2xl bg-card border border-border">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-typing" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
};
