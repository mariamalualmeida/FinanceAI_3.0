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

  const quickActions = [
    "Calcular Score de Crédito",
    "Detectar Apostas",
    "Análise de Risco",
    "Gerar Relatório"
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="material-icon text-white text-sm">smart_toy</span>
            </div>
            <div className="chat-bubble-ai rounded-2xl rounded-tl-sm p-4 max-w-2xl">
              <p className="text-foreground font-medium mb-2">
                Olá! Sou seu assistente de análise financeira.
              </p>
              <p className="text-muted-foreground">Posso ajudá-lo a:</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li className="flex items-center">
                  <span className="material-icon text-success-500 text-sm mr-2">check_circle</span>
                  Analisar extratos bancários e faturas
                </li>
                <li className="flex items-center">
                  <span className="material-icon text-success-500 text-sm mr-2">check_circle</span>
                  Calcular scores de crédito
                </li>
                <li className="flex items-center">
                  <span className="material-icon text-success-500 text-sm mr-2">check_circle</span>
                  Detectar movimentações suspeitas
                </li>
                <li className="flex items-center">
                  <span className="material-icon text-success-500 text-sm mr-2">check_circle</span>
                  Gerar relatórios profissionais
                </li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                Comece enviando documentos ou fazendo uma pergunta!
              </p>
            </div>
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

      {/* Input Area */}
      <div className="bg-card border-t border-border p-4">
        <div className="flex items-end space-x-3">
          {/* Attachment Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="rounded-lg hover:bg-muted"
          >
            <Paperclip className="h-5 w-5" />
          </Button>

          {/* Message Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Digite sua mensagem ou pergunta sobre análise financeira..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="resize-none min-h-[44px] max-h-[120px] rounded-lg border-input focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={1}
            />
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isSendingMessage}
            className="rounded-lg bg-primary hover:bg-primary/90"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickActions.map((action) => (
            <Button
              key={action}
              variant="secondary"
              size="sm"
              onClick={() => setInputMessage(action)}
              className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-full text-sm"
            >
              {action}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
