import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Menu, Send, User, Settings, HelpCircle, Plus, Paperclip, Sun, Moon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message } from "@shared/schema";

export function SimpleLayout() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

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

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const welcomeMessage = (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Bem-vindo ao FinanceAI</h2>
        <p className="text-gray-400 mb-6">Selecione uma conversa ou inicie uma nova para começar</p>
        <button
          onClick={handleNewConversation}
          disabled={createConversationMutation.isPending}
          className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
        >
          <Plus size={16} />
          Nova Conversa
        </button>
      </div>
    </div>
  );

  return (
    <div className={`${darkMode ? "dark" : ""}`}>
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0 transition-transform duration-300 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col justify-between ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:w-64`}>
          <div className="space-y-4">
            <button 
              onClick={handleNewConversation}
              disabled={createConversationMutation.isPending}
              className="w-full flex items-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-500 transition-colors"
            >
              <Plus size={16} /> Nova Conversa
            </button>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {conversations.slice(0, 10).map((conv) => (
                <a
                  key={conv.id}
                  href={`/chat/${conv.id}`}
                  className={`block p-3 rounded transition-colors ${
                    conv.id === conversationId 
                      ? "bg-green-600 text-white" 
                      : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
                  }`}
                >
                  <div className="truncate text-sm font-medium">
                    {conv.title || "Nova Conversa"}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString('pt-BR') : "Hoje"}
                  </div>
                </a>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <a href="/settings" className="flex items-center gap-2 text-sm hover:text-green-500 transition-colors">
              <Settings size={16} /> Configurações
            </a>
            <a href="/profile" className="flex items-center gap-2 text-sm hover:text-green-500 transition-colors">
              <User size={16} /> Perfil
            </a>
            <a href="/help" className="flex items-center gap-2 text-sm hover:text-green-500 transition-colors">
              <HelpCircle size={16} /> Ajuda
            </a>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <button 
                className="md:hidden p-2 hover:bg-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors" 
                onClick={() => setSidebarOpen(!sidebarOpen)}
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

          {/* Messages or Welcome */}
          {!conversationId ? welcomeMessage : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={msg.id || idx}
                    className={`max-w-2xl px-4 py-3 rounded-2xl ${
                      msg.role === "user" 
                        ? "bg-green-600 text-white ml-auto" 
                        : "bg-gray-300 dark:bg-gray-700 mr-auto"
                    }`}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                    <div className="text-xs opacity-70 mt-2">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : "Agora"}
                    </div>
                  </motion.div>
                ))}
                <div ref={scrollRef} />
              </div>

              {/* Input */}
              <footer className="p-4 bg-gray-200 dark:bg-gray-800 border-t border-gray-300 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-gray-400 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    <Paperclip size={20} />
                  </button>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 resize-none bg-gray-300 dark:bg-gray-700 p-3 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    disabled={sendMessageMutation.isPending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessageMutation.isPending}
                    className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}