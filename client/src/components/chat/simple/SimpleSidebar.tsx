import { Plus, Settings, User, HelpCircle, Sun, Moon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation } from "@shared/schema";

interface SimpleSidebarProps {
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  conversationId?: string;
}

export default function SimpleSidebar({ 
  darkMode, 
  setDarkMode, 
  sidebarOpen, 
  setSidebarOpen, 
  conversationId 
}: SimpleSidebarProps) {
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: () => apiRequest("/api/conversations", "POST", { title: "Nova Conversa" }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      window.location.href = `/chat/${data.id}`;
    },
  });

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0 transition-transform duration-300 bg-gray-200 dark:bg-gray-800 p-4 flex flex-col justify-between ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:w-64`}>
      <div className="space-y-4">
        <button 
          onClick={() => createConversationMutation.mutate()}
          disabled={createConversationMutation.isPending}
          className="w-full flex items-center gap-2 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-50"
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
        <button 
          onClick={() => setDarkMode(!darkMode)}
          className="flex items-center gap-2 text-sm hover:text-green-500 transition-colors"
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? 'Modo Claro' : 'Modo Escuro'}
        </button>
      </div>
    </aside>
  );
}