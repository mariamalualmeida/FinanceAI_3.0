import { useState, useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useFileUpload } from "@/hooks/useFileUpload";
import { MessageBubble } from "./MessageBubble";
import { FileUpload } from "./FileUpload";
import { TypingIndicator } from "./TypingIndicator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip } from "lucide-react";

export function ChatInterface() {
  const { 
    messages, 
    currentConversation, 
    sendMessage, 
    isSendingMessage,
    createConversation 
  } = useChat();
  
  const { uploadFile, isUploading } = useFileUpload({
    onUploadComplete: (file) => {
      toast({
        title: "Arquivo enviado com sucesso",
        description: `${file.originalName} foi processado`,
      });
    },
    onUploadError: (error) => {
      toast({
        title: "Erro no upload",
        description: error,
        variant: "destructive",
      });
    },
  });

  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState("");
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");

    try {
      await sendMessage(message);
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!currentConversation) {
      const newConversation = await createConversation("Análise de Documentos");
      for (const file of files) {
        await uploadFile(file, newConversation.id);
      }
    } else {
      for (const file of files) {
        await uploadFile(file, currentConversation.id);
      }
    }
    setShowFileUpload(false);
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputMessage]);

  return (
    <div className="chat-container">
      {/* Messages Area - Mobile optimized */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl text-primary">💬</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Assistente Financeiro IA
            </h3>
            <p className="text-muted-foreground max-w-md">
              Digite sua mensagem ou envie documentos financeiros para análise inteligente
            </p>
          </div>
        )}

        {/* File Upload Area */}
        {showFileUpload && (
          <FileUpload
            onFileUpload={handleFileUpload}
            onClose={() => setShowFileUpload(false)}
            isUploading={isUploading}
          />
        )}

        {/* Messages */}
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {isSendingMessage && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Mobile optimized */}
      <div className="input-area bg-background border-t border-border">
        <div className="flex items-end space-x-3 max-w-4xl mx-auto">
          {/* Attachment Button - Touch friendly */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="touch-44 rounded-xl hover:bg-muted shrink-0"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Message Input - Mobile optimized */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem sobre análise financeira..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="input-mobile resize-none border-2 border-border rounded-xl focus:border-primary focus:ring-0 bg-background"
              rows={1}
            />
          </div>

          {/* Send Button - Touch friendly */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSendingMessage}
            className="touch-44 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}