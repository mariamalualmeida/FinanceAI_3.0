import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  MessageSquare, 
  Search, 
  Settings, 
  X,
  Plus,
  MoreVertical,
  Archive,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ModernSettingsModal } from "@/components/settings/ModernSettingsModal";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation } from "@shared/schema";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const [location] = useLocation();
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const createConversationMutation = useMutation({
    mutationFn: () => apiRequest("/api/conversations", "POST", { title: "Nova Conversa" }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      window.location.href = `/chat/${data.id}`;
    },
  });

  const archiveConversationMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/conversations/${id}`, "PATCH", { archived: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/conversations/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewConversation = () => {
    createConversationMutation.mutate();
  };

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    archiveConversationMutation.mutate(id);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteConversationMutation.mutate(id);
  };

  // Previne que cliques na sidebar fechem ela
  const handleSidebarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay para mobile */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onToggle}
      />
      
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed left-0 top-0 h-full w-80 bg-card border-r border-border z-50 flex flex-col",
          "transform transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0"
        )}
        onClick={handleSidebarClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-xl font-semibold">FinanceAI</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar conversas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* New Conversation Button */}
        <div className="p-4">
          <Button
            onClick={handleNewConversation}
            disabled={createConversationMutation.isPending}
            className="w-full justify-center"
            size="lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "group flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent transition-colors",
                      location === `/chat/${conversation.id}` && "bg-accent"
                    )}
                  >
                    <Link
                      href={`/chat/${conversation.id}`}
                      className="flex-1 min-w-0"
                    >
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(conversation.updatedAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </Link>
                    
                    {/* Three dots menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleArchive(conversation.id, e)}
                          disabled={archiveConversationMutation.isPending}
                        >
                          <Archive className="h-4 w-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => handleDelete(conversation.id, e)}
                          disabled={deleteConversationMutation.isPending}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
                  <p className="text-xs text-muted-foreground mt-1">Comece uma nova conversa acima</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Settings Button - Bottom fixed */}
        <div className="p-4 border-t border-border shrink-0 bg-card/95 backdrop-blur-sm">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(true)}
            className="w-full justify-start h-12 text-sm"
            size="lg"
          >
            <Settings className="h-4 w-4 mr-3" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <ModernSettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
      />
    </>
  );
}