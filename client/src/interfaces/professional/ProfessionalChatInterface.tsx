import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message } from "@shared/schema";

interface ProfessionalChatInterfaceProps {
  conversationId?: string;
}

export function ProfessionalChatInterface({ conversationId }: ProfessionalChatInterfaceProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", conversationId],
    enabled: !!conversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(`/api/conversations/${conversationId}/messages`, "POST", { 
        content, 
        role: "user" 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", conversationId] });
      setInput("");
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!input.trim() || !conversationId) return;
    sendMessageMutation.mutate(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="bg-gray-800 p-4 border-b border-gray-600">
          <h2 className="text-lg font-semibold text-white text-center">
            Chat com FinanceAI
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-gray-900" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Bem-vindo ao FinanceAI</h2>
            <p className="text-gray-400">Selecione uma conversa ou inicie uma nova para começar</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-600">
        <h2 className="text-lg font-semibold text-white text-center">
          Chat com FinanceAI
        </h2>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-700" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#4B5563 transparent'
      }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start max-w-4xl ${
              message.role === "user" ? "justify-end ml-auto" : "justify-start mr-auto"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <Bot className="h-4 w-4 text-blue-400" />
              </div>
            )}
            
            <div
              className={`px-4 py-3 rounded-2xl max-w-2xl ${
                message.role === "user"
                  ? "bg-teal-700 text-white rounded-br-sm"
                  : "bg-gray-600 text-gray-100 rounded-bl-sm"
              }`}
            >
              <div className="text-sm font-medium mb-1 opacity-80">
                {message.role === "user" ? "Você" : "FinanceAI"}
              </div>
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </div>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center ml-3 flex-shrink-0">
                <User className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-600">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              className="resize-none bg-gray-600 border-gray-500 text-white placeholder-gray-300 rounded-3xl px-5 py-3 min-h-[50px] max-h-[120px] focus:ring-2 focus:ring-blue-500"
              rows={1}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="bg-blue-500 hover:bg-blue-400 text-gray-900 w-12 h-12 rounded-full p-0 flex items-center justify-center"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}