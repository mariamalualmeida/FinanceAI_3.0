import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, MessageSquare, Settings, User, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation } from "@shared/schema";

interface SimpleSidebarProps {
  onClose: () => void;
}

export function SimpleSidebar({ onClose }: SimpleSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

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

  const filteredConversations = conversations.filter(conv =>
    (conv.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  return (
    <div className="h-full bg-gray-800 p-4 flex flex-col justify-between">
      {/* Header with close button */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">FinanceAI</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <Button
          onClick={handleNewConversation}
          disabled={createConversationMutation.isPending}
          className="w-full bg-green-600 hover:bg-green-500 text-white mb-4 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Conversa
        </Button>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar conversas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-2">
          {filteredConversations.map((conversation) => (
            <a
              key={conversation.id}
              href={`/chat/${conversation.id}`}
              className="block p-3 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {conversation.title || "Nova Conversa"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {conversation.updatedAt ? new Date(conversation.updatedAt).toLocaleDateString('pt-BR') : "Hoje"}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="space-y-3 pt-4 border-t border-gray-700">
        <a href="/settings" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
          <Settings className="h-4 w-4" />
          Configurações
        </a>
        <a href="/profile" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
          <User className="h-4 w-4" />
          Perfil
        </a>
        <a href="/help" className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
          <HelpCircle className="h-4 w-4" />
          Ajuda
        </a>
      </div>
    </div>
  );
}