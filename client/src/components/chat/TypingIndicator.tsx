export function TypingIndicator() {
  return (
    <div className="flex items-start space-x-3">
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
        <span className="material-icon text-white text-sm">smart_toy</span>
      </div>
      <div className="chat-bubble-ai rounded-2xl rounded-tl-sm p-4">
        <div className="typing-indicator flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
