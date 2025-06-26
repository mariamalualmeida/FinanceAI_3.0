import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare, Settings, User, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation } from "@shared/schema";

export function ProfessionalSidebar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  return (
    <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-80'} bg-gray-800 p-5 flex flex-col justify-between transition-all duration-300 border-r border-gray-600`}>
      <div className="space-y-6">
        {/* New Chat Button */}
        <Button
          onClick={handleNewConversation}
          disabled={createConversationMutation.isPending}
          className="w-full bg-blue-500 hover:bg-blue-400 text-gray-900 font-bold py-3 px-5 rounded-full flex items-center gap-3 transition-all duration-300"
        >
          <Plus className="h-4 w-4" />
          {!isSidebarCollapsed && <span>Novo Chat</span>}
        </Button>

        {/* Chat History */}
        {!isSidebarCollapsed && (
          <div>
            <h3 className="text-gray-300 text-sm uppercase font-medium mb-4 opacity-70">
              Chats Recentes
            </h3>
            <div className="space-y-2">
              {conversations.slice(0, 8).map((conversation) => (
                <a
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-gray-300 hover:text-white"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {conversation.title || "Nova Conversa"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed state - just icons */}
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
    </aside>
  );
}