import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { formatRelativeTime, truncateText } from "@/lib/authUtils";
import { Menu, Settings, MessageSquare, FileText, X, Plus, Archive, Trash2, Search } from "lucide-react";

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { user } = useAuth();
  const { 
    conversations, 
    currentConversation, 
    selectConversation, 
    createConversation 
  } = useChat();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const handleNewChat = async () => {
    await createConversation();
    if (onClose) onClose(); // Fecha sidebar no mobile após criar nova conversa
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "processing":
        return "bg-blue-500";  
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Concluído";
      case "processing":
        return "Em análise";
      case "error":
        return "Erro";
      default:
        return "Pendente";
    }
  };

  return (
    <>
      {/* Mobile Sidebar - Full screen overlay */}
      <div className="fixed inset-0 z-50 bg-background flex flex-col lg:relative lg:w-80 lg:bg-card lg:border-r lg:border-border">
        {/* Header - Clean and minimal */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">FinanceAI</h1>
              <p className="text-xs text-muted-foreground truncate">Análise Inteligente</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden shrink-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Info - Compact for mobile */}
        <div className="p-4 border-b border-border bg-card/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <span className="text-sm font-medium text-primary">
                {user?.firstName?.[0] || user?.username?.[0] || "U"}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username || 'Usuário'}
              </p>
              <p className="text-xs text-muted-foreground">Consultor Financeiro</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Mobile friendly */}
        <div className="p-4 shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="chat" className="text-xs font-medium">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="reports" className="text-xs font-medium">
                <FileText className="h-4 w-4 mr-2" />
                Relatórios
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Action Buttons - Touch friendly */}
        <div className="px-4 pb-4 shrink-0 space-y-3">
          <Button
            onClick={handleNewChat}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nova Conversa
          </Button>
          
          {/* Search and Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="flex-1 h-10"
              title="Pesquisar conversas"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="flex-1 h-10"
              title="Arquivar conversa"
            >
              <Archive className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="flex-1 h-10"
              title="Excluir conversa"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Conversations List - Scrollable area */}
        <div className="flex-1 overflow-hidden">
          <div className="px-4 pb-3">
            <h3 className="text-sm font-medium text-muted-foreground">Conversas Recentes</h3>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-3 pb-4">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => {
                    selectConversation(conversation.id);
                    if (onClose) onClose(); // Fecha sidebar no mobile após selecionar
                  }}
                  className={`
                    p-4 rounded-xl cursor-pointer transition-all duration-200 border
                    ${currentConversation?.id === conversation.id 
                      ? 'bg-primary/10 border-primary/20 shadow-sm' 
                      : 'hover:bg-muted/50 border-transparent hover:border-muted'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-foreground truncate leading-tight">
                        {truncateText(conversation.title || "Nova Conversa", 28)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(conversation.updatedAt)}
                      </p>
                      <div className="flex items-center mt-2">
                        <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(conversation.status || 'pending')}`} />
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(conversation.status || 'pending')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {conversations.length === 0 && (
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
      <SettingsModal 
        open={showSettings} 
        onOpenChange={setShowSettings}
      />
    </>
  );
}