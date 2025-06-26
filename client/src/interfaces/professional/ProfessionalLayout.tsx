import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { Plus, MessageSquare, Settings, User, HelpCircle, Bot, Send, Paperclip } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message } from "@shared/schema";

export function ProfessionalLayout() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

  const welcomeScreen = (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bot className="h-8 w-8 text-gray-900" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Bem-vindo ao FinanceAI Professional</h2>
        <p className="text-gray-400 mb-6">Análises financeiras avançadas com IA</p>
        <button
          onClick={handleNewConversation}
          disabled={createConversationMutation.isPending}
          className="bg-blue-500 hover:bg-blue-400 text-gray-900 font-bold py-3 px-6 rounded-full flex items-center gap-3 mx-auto transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          Novo Chat
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex justify-center items-center min-h-screen p-4" style={{ backgroundColor: '#121212' }}>
      <div className="flex w-full max-w-7xl h-[95vh] rounded-lg overflow-hidden shadow-2xl" style={{ backgroundColor: '#202124' }}>
        
        {/* Sidebar */}
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} transition-all duration-300 border-r border-gray-600`} style={{ backgroundColor: '#1A1A1D' }}>
          <div className="p-5 h-full flex flex-col justify-between">
            <div className="space-y-6">
              {/* New Chat Button */}
              <button
                onClick={handleNewConversation}
                disabled={createConversationMutation.isPending}
                className="w-full bg-blue-500 hover:bg-blue-400 text-gray-900 font-bold py-3 px-5 rounded-full flex items-center gap-3 transition-all duration-300"
              >
                <Plus className="h-4 w-4" />
                {!isSidebarCollapsed && <span>Novo Chat</span>}
              </button>

              {/* Chat History */}
              {!isSidebarCollapsed && (
                <div>
                  <h3 className="text-gray-300 text-sm uppercase font-medium mb-4 opacity-70">
                    Chats Recentes
                  </h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto" style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#3C4043 transparent'
                  }}>
                    {conversations.slice(0, 8).map((conversation) => (
                      <a
                        key={conversation.id}
                        href={`/chat/${conversation.id}`}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
                          conversation.id === conversationId
                            ? 'bg-gray-600 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        <MessageSquare className="h-4 w-4 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {conversation.title || "Nova Conversa"}
                          </p>
                          <p className="text-xs opacity-70 mt-1">
                            {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString('pt-BR') : "Hoje"}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Collapsed Icons */}
              {isSidebarCollapsed && (
                <div className="space-y-4">
                  {conversations.slice(0, 5).map((conversation) => (
                    <a
                      key={conversation.id}
                      href={`/chat/${conversation.id}`}
                      className="flex justify-center p-3 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="space-y-4 pt-5 border-t border-gray-600">
              <a
                href="/settings"
                className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                <Settings className="h-4 w-4" />
                {!isSidebarCollapsed && <span>Configurações</span>}
              </a>
              <a
                href="/help"
                className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                <HelpCircle className="h-4 w-4" />
                {!isSidebarCollapsed && <span>Ajuda</span>}
              </a>
              <a
                href="/profile"
                className="flex items-center gap-3 text-gray-300 hover:text-blue-400 transition-colors text-sm"
              >
                <User className="h-4 w-4" />
                {!isSidebarCollapsed && <span>Mig</span>}
              </a>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col" style={{ backgroundColor: '#242528' }}>
          
          {/* Header */}
          <div className="p-4 border-b border-gray-600" style={{ backgroundColor: '#1A1A1D' }}>
            <h2 className="text-lg font-semibold text-white text-center">
              Chat com FinanceAI
            </h2>
          </div>

          {/* Content */}
          {!conversationId ? welcomeScreen : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#4B5563 transparent'
              }}>
                {messages.map((message, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key={message.id || idx}
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
                          ? "text-white rounded-br-sm"
                          : "bg-gray-600 text-gray-100 rounded-bl-sm"
                      }`}
                      style={{
                        backgroundColor: message.role === "user" ? '#004D40' : '#3C4043'
                      }}
                    >
                      <div className="text-sm font-medium mb-1 opacity-80">
                        {message.role === "user" ? "Você" : "FinanceAI"}
                      </div>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                      <div className="text-xs opacity-60 mt-2">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "Agora"}
                      </div>
                    </div>

                    {message.role === "user" && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center ml-3 flex-shrink-0" style={{ backgroundColor: '#004D40' }}>
                        <User className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </motion.div>
                ))}
                <div ref={scrollRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-gray-600" style={{ backgroundColor: '#1A1A1D' }}>
                <div className="flex items-end gap-4">
                  <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                    <Paperclip className="h-5 w-5 text-gray-400" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Digite sua mensagem..."
                      className="w-full resize-none bg-gray-600 border-gray-500 text-white placeholder-gray-300 rounded-3xl px-5 py-3 min-h-[50px] max-h-[120px] focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      rows={1}
                      disabled={sendMessageMutation.isPending}
                    />
                  </div>
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessageMutation.isPending}
                    className="bg-blue-500 hover:bg-blue-400 text-gray-900 w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}