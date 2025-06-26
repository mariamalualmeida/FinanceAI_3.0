import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Menu, Settings, User, HelpCircle, Sun, Moon, Paperclip, RotateCcw, MoreHorizontal, Share, Edit3, FolderPlus, Archive, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export function ChatGPTLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editingConversation, setEditingConversation] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { currentConversation, conversations, messages, sendMessage, createConversation, setCurrentConversation, isSendingMessage } = useChat();
  const { user, logout } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const sendingMessage = isSendingMessage;

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }, [message]);

  // Conversation menu handlers
  const handleRenameConversation = (id: string, currentTitle: string) => {
    setEditingConversation(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (id: string) => {
    if (editTitle.trim()) {
      // TODO: Implement updateConversation in useChat hook
      console.log('Renaming conversation:', id, 'to:', editTitle);
    }
    setEditingConversation(null);
    setEditTitle('');
  };

  const handleDeleteConversation = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta conversa?')) {
      // TODO: Implement deleteConversation in useChat hook
      console.log('Deleting conversation:', id);
    }
  };

  const handleArchiveConversation = async (id: string) => {
    // TODO: Implement archiveConversation in useChat hook
    console.log('Archiving conversation:', id);
  };

  const handleShareConversation = async (id: string) => {
    // TODO: Implement conversation sharing
    console.log('Sharing conversation:', id);
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
      if (selectedFile) {
        // Handle file upload with message
        console.log('Uploading file:', selectedFile.name);
        setSelectedFile(null);
      }
      
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
                className={cn(
                  "group relative w-full p-3 rounded-lg mb-2 transition-colors",
                  currentConversation?.id === conv.id 
                    ? "bg-gray-700" 
                    : "hover:bg-gray-700"
                )}
              >
                {editingConversation === conv.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveRename(conv.id);
                        } else if (e.key === 'Escape') {
                          setEditingConversation(null);
                        }
                      }}
                      onBlur={() => handleSaveRename(conv.id)}
                      className="flex-1 bg-gray-600 text-white text-sm border-none outline-none rounded px-2 py-1"
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    onClick={() => {
                      setCurrentConversation(conv.id);
                      setSidebarOpen(false);
                    }}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{conv.title}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(conv.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    {/* Menu de três pontos */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-white hover:bg-gray-600 ml-2 h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="w-48 bg-gray-800 border-gray-700 text-white"
                      >
                        <DropdownMenuItem 
                          onClick={() => handleShareConversation(conv.id)}
                          className="hover:bg-gray-700 cursor-pointer"
                        >
                          <Share size={14} className="mr-2" />
                          Compartilhar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRenameConversation(conv.id, conv.title || 'Nova Conversa')}
                          className="hover:bg-gray-700 cursor-pointer"
                        >
                          <Edit3 size={14} className="mr-2" />
                          Renomear
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => console.log('Add to project:', conv.id)}
                          className="hover:bg-gray-700 cursor-pointer"
                        >
                          <FolderPlus size={14} className="mr-2" />
                          Adicionar ao projeto
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          onClick={() => handleArchiveConversation(conv.id)}
                          className="hover:bg-gray-700 cursor-pointer"
                        >
                          <Archive size={14} className="mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteConversation(conv.id)}
                          className="hover:bg-gray-700 cursor-pointer text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
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
              <div className="flex items-end gap-2 bg-gray-700 border border-gray-600 rounded-lg p-3 focus-within:border-gray-500">
                {/* Botão de anexar arquivo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.jpeg,.png"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-400 hover:text-white hover:bg-gray-600 flex-shrink-0"
                >
                  <Paperclip size={16} />
                </Button>

                {/* Textarea para mensagem */}
                <Textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Pergunte alguma coisa"
                  className="flex-1 bg-transparent border-0 text-white placeholder-gray-400 resize-none min-h-[40px] max-h-32 focus:ring-0 focus:outline-none"
                  rows={1}
                />

                {/* Botões de ação */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-white hover:bg-gray-600"
                  >
                    <RotateCcw size={16} />
                  </Button>
                  <Button
                    type="submit"
                    size="icon"
                    disabled={!message.trim() || sendingMessage}
                    className="bg-white text-gray-900 hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-600"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
              
              {/* Arquivo selecionado */}
              {selectedFile && (
                <div className="mt-2 flex items-center gap-2 p-2 bg-gray-600 rounded text-sm">
                  <Paperclip size={14} />
                  <span className="text-gray-200">{selectedFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-gray-400 hover:text-white ml-auto"
                  >
                    ×
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}