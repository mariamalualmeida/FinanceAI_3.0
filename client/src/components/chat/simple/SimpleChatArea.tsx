import { useState, useEffect, useRef } from "react";
import { Menu, Plus, Sun, Moon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SimpleMessageBubble, SimpleInputArea } from ".";
import type { Message } from "@shared/schema";

interface SimpleChatAreaProps {
  conversationId?: string;
  setSidebarOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
}

function SimpleChatArea({ 
  conversationId, 
  setSidebarOpen, 
  darkMode, 
  setDarkMode 
}: SimpleChatAreaProps) {
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
    <main className="flex-1 flex flex-col overflow-hidden">
      <header className="flex items-center justify-between p-4 border-b bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button 
            className="md:hidden p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors" 
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold">FinanceAI</h1>
        </div>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {!conversationId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Bem-vindo ao FinanceAI</h2>
            <p className="text-gray-400 mb-6">Selecione uma conversa ou inicie uma nova para começar</p>
            <button
              onClick={() => createConversationMutation.mutate()}
              disabled={createConversationMutation.isPending}
              className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto disabled:opacity-50"
            >
              <Plus size={16} />
              Nova Conversa
            </button>
          </div>
        </div>
      ) : (
        <>
          <section className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <SimpleMessageBubble key={msg.id || idx} message={msg} />
            ))}
            <div ref={scrollRef} />
          </section>

          <footer className="p-4 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
            <SimpleInputArea 
              onSend={handleSendMessage}
              disabled={sendMessageMutation.isPending}
            />
          </footer>
        </>
      )}
    </main>
  );
}

export default SimpleChatArea;