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

      {/* Input Area - Full width with integrated buttons */}
      <div className="input-area bg-background border-t border-border p-4">
        <div className="w-full relative">
          {/* Full-width input with integrated buttons */}
          <div className="relative flex items-end bg-muted/30 rounded-2xl border border-border focus-within:border-primary/50 transition-colors">
            {/* Attachment Button - Inside left */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="m-2 h-10 w-10 rounded-xl hover:bg-muted/70 shrink-0"
            >
              <Paperclip className="h-5 w-5" />
            </Button>

            {/* Message Input - Full width */}
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem sobre análise financeira..."
              className="flex-1 min-h-[52px] max-h-32 resize-none border-0 bg-transparent focus:ring-0 focus:outline-none px-0 py-3 placeholder:text-muted-foreground"
              rows={1}
            />

            {/* Send Button - Inside right */}
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSendingMessage}
              className="m-2 h-10 w-10 rounded-xl shrink-0 bg-primary hover:bg-primary/90"
              size="icon"
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}