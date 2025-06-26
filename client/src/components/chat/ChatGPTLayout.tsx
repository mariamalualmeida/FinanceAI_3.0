import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, Settings, User, HelpCircle, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function ChatGPTLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const { currentConversation, conversations, messages, sendMessage, createConversation, setCurrentConversation } = useChat();
  const { user, logout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    try {
      await sendMessage(message);
      setMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleNewChat = async () => {
    try {
      await createConversation();
      setSidebarOpen(false);
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-800 text-white">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Header com botão Nova Conversa */}
          <div className="p-3">
            <Button
              onClick={handleNewChat}
              className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 px-4 flex items-center gap-2"
            >
              <Plus size={16} />
              Nova Conversa
            </Button>
          </div>

          {/* Lista de conversas */}
          <div className="flex-1 overflow-y-auto px-3">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setCurrentConversation(conv.id);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "w-full p-3 rounded-lg mb-2 text-left cursor-pointer transition-colors",
                  currentConversation?.id === conv.id 
                    ? "bg-gray-700" 
                    : "hover:bg-gray-700"
                )}
              >
                <div className="font-medium text-sm truncate">{conv.title}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>

          {/* Menu inferior */}
          <div className="p-3 border-t border-gray-700">
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <Settings size={16} className="mr-2" />
                Configurações
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <User size={16} className="mr-2" />
                Perfil
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                <HelpCircle size={16} className="mr-2" />
                Ajuda
              </Button>
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700"
              >
                {theme === 'dark' ? <Sun size={16} className="mr-2" /> : <Moon size={16} className="mr-2" />}
                Modo Claro
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Área principal */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden text-gray-300 hover:text-white"
            >
              <Menu size={20} />
            </Button>
            <h1 className="text-lg font-semibold">
              {currentConversation ? 'ChatGPT' : 'FinanceAI'}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-gray-300 hover:text-white"
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </Button>
        </div>

        {/* Área de mensagens */}
        <div className="flex-1 overflow-y-auto">
          {!currentConversation ? (
            // Tela inicial - igual ao ChatGPT
            <div className="flex flex-col items-center justify-center h-full px-4">
              <h2 className="text-3xl font-bold mb-4 text-center">
                Tudo pronto quando você também estiver.
              </h2>
              <p className="text-gray-400 text-center mb-8 max-w-md">
                Selecione uma conversa ou inicie uma nova para começar
              </p>
              <Button
                onClick={handleNewChat}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 px-6"
              >
                <Plus size={16} className="mr-2" />
                Nova Conversa
              </Button>
            </div>
          ) : (
            // Área de chat com mensagens
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((msg) => (
                <div key={msg.id} className={cn(
                  "mb-6 flex",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-lg",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-700 text-gray-100"
                  )}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input de mensagem - igual ao ChatGPT */}
        <div className="border-t border-gray-700 p-4">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="relative">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Pergunte alguma coisa"
                className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-lg py-3 pr-12 focus:border-gray-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-transparent hover:bg-gray-600 disabled:opacity-50"
              >
                <Send size={16} />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}