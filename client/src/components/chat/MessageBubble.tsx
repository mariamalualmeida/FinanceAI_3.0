import { type Message } from "@/types";
import { formatRelativeTime } from "@/lib/authUtils";
import { AnalysisResults } from "@/components/analysis/AnalysisResults";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="bg-muted text-muted-foreground text-sm px-4 py-2 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary text-primary-foreground">
            <span className="material-icon text-sm">smart_toy</span>
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={`rounded-2xl p-4 max-w-2xl ${
          isUser
            ? "chat-bubble-user text-white rounded-tr-sm"
            : "chat-bubble-ai rounded-tl-sm"
        }`}
      >
        <div className={isUser ? "text-white" : "text-foreground"}>
          {message.content}
        </div>

        {/* Render analysis results if present in metadata */}
        {message.metadata?.analysisResults && (
          <div className="mt-4">
            <AnalysisResults results={message.metadata.analysisResults} />
          </div>
        )}

        {/* File processing status */}
        {message.metadata?.fileStatus && (
          <div className="mt-3 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {message.metadata.fileStatus.originalName}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  message.metadata.fileStatus.status === "completed"
                    ? "text-success-600 bg-success-50"
                    : message.metadata.fileStatus.status === "processing"
                    ? "text-blue-600 bg-blue-50"
                    : message.metadata.fileStatus.status === "error"
                    ? "text-red-600 bg-red-50"
                    : "text-yellow-600 bg-yellow-50"
                }`}
              >
                {message.metadata.fileStatus.status === "completed"
                  ? "Processado"
                  : message.metadata.fileStatus.status === "processing"
                  ? "Processando"
                  : message.metadata.fileStatus.status === "error"
                  ? "Erro"
                  : "Aguardando"}
              </span>
            </div>
            {message.metadata.fileStatus.status === "completed" && (
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success-500 h-2 rounded-full w-full"></div>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 text-xs opacity-70">
          {formatRelativeTime(message.createdAt)}
        </div>
      </div>

      {isUser && (
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-muted text-muted-foreground">
            <span className="material-icon text-sm">person</span>
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
