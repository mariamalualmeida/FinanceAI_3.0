import { useState, useEffect, useRef } from "react";
import { Bot, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ProfessionalMessageBubble from "./ProfessionalMessageBubble";
import ProfessionalInputArea from "./ProfessionalInputArea";
import type { Message } from "@shared/schema";

interface ProfessionalChatAreaProps {
  conversationId?: string;
}

export default function ProfessionalChatArea({ conversationId }: ProfessionalChatAreaProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", conversationId],
    enabled: !!conversationId,
  });

  const createConversationMutation = useMutation({
    mutationFn: () => apiRequest("/api/conversations", "POST", { title: "Nova Conversa" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      window.location.href = `/chat/${data.id}`;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: (content: string) => 
      apiRequest(`/api/conversations/${conversationId}/messages`, "POST", { 
        content, 
        role: "user" 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", conversationId] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (text: string) => {
    if (!conversationId) return;
    sendMessageMutation.mutate(text);
  };

  return (
    <main className="flex-1 flex flex-col" style={{ backgroundColor: '#242528' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-600" style={{ backgroundColor: '#1A1A1D' }}>
        <h2 className="text-lg font-semibold text-white text-center">
          Chat com FinanceAI
        </h2>
      </div>

      {/* Content */}
      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-gray-900" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Bem-vindo ao FinanceAI Professional</h2>
            <p className="text-gray-400 mb-6">Análises financeiras avançadas com IA</p>
            <button
              onClick={() => createConversationMutation.mutate()}
              disabled={createConversationMutation.isPending}
              className="bg-blue-500 hover:bg-blue-400 text-gray-900 font-bold py-3 px-6 rounded-full flex items-center gap-3 mx-auto transition-all duration-300 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Novo Chat
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4B5563 transparent'
          }}>
            {messages.map((message, idx) => (
              <ProfessionalMessageBubble key={message.id || idx} message={message} />
            ))}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-600" style={{ backgroundColor: '#1A1A1D' }}>
            <ProfessionalInputArea 
              onSend={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
          </div>
        </>
      )}
    </main>
  );
}