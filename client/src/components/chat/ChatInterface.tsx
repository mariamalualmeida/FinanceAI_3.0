import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Paperclip, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { Message, Conversation } from "@shared/schema";

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  isUploading: boolean;
}

function FileUploadButton({ onFileSelect, isUploading }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleFileClick}
        disabled={isUploading}
        className="h-10 w-10 p-0 hover:bg-accent"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={cn("flex mb-4", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] px-4 py-3 rounded-2xl",
          isUser
            ? "bg-primary text-primary-foreground ml-4"
            : "bg-muted text-foreground mr-4"
        )}
      >
        <div className="text-sm whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="text-xs opacity-70 mt-2">
          {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}

export function ChatInterface() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  // Fetch current conversation
  const { data: conversation } = useQuery<Conversation>({
    queryKey: ["/api/conversations", conversationId],
    enabled: !!conversationId,
  });

  // Fetch messages for current conversation
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/conversations", conversationId, "messages"],
    enabled: !!conversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error("No conversation selected");
      return apiRequest(`/api/chat/message`, "POST", {
        conversationId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations"] 
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente em alguns instantes",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (files: File[]) => {
      if (!conversationId) throw new Error("No conversation selected");
      
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      formData.append('conversationId', conversationId);

      return fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      }).then(res => res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["/api/conversations", conversationId, "messages"] 
      });
      toast({
        title: "Arquivo enviado com sucesso",
        description: "Arquivo foi processado e analisado",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar o arquivo",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || sendMessageMutation.isPending) return;

    const message = inputMessage.trim();
    setInputMessage("");
    
    sendMessageMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!conversationId) {
      toast({
        title: "Selecione uma conversa",
        description: "Crie uma nova conversa antes de enviar arquivos",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    try {
      await uploadFileMutation.mutateAsync(files);
    } finally {
      setIsUploading(false);
    }
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

  if (!conversationId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Plus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">
          Bem-vindo ao FinanceAI
        </h3>
        <p className="text-muted-foreground max-w-md">
          Selecione uma conversa existente ou crie uma nova para começar a análise financeira
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Assistente Financeiro IA
            </h3>
            <p className="text-muted-foreground max-w-md">
              Digite sua mensagem ou envie documentos financeiros para análise inteligente
            </p>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {sendMessageMutation.isPending && (
          <div className="flex justify-start mb-4">
            <div className="bg-muted text-foreground mr-4 px-4 py-3 rounded-2xl max-w-[80%]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-100"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-200"></div>
                </div>
                <span className="text-sm text-muted-foreground">Analisando...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Full Width */}
      <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
        <div className="flex items-end space-x-2 w-full">
          <FileUploadButton 
            onFileSelect={handleFileUpload} 
            isUploading={isUploading || uploadFileMutation.isPending}
          />
          
          <div className="flex-1 min-w-0">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem sobre análise financeira..."
              className="min-h-[40px] max-h-[120px] resize-none w-full"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sendMessageMutation.isPending}
            size="sm"
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {(isUploading || uploadFileMutation.isPending) && (
          <div className="mt-2 text-sm text-muted-foreground">
            Enviando arquivo...
          </div>
        )}
      </div>
    </div>
  );
}