import { useState } from "react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsModal } from "@/components/settings/SettingsModal";
import { formatRelativeTime, truncateText } from "@/lib/authUtils";
import { Menu, Settings, MessageSquare, FileText, Bot } from "lucide-react";

export function Sidebar() {
  const { user } = useAuth();
  const { conversations, currentConversation, selectConversation, createConversation } = useChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation("Nova Conversa");
      selectConversation(newConversation.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success-500";
      case "processing":
        return "bg-blue-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Processado";
      case "processing":
        return "Em análise";
      case "error":
        return "Erro";
      default:
        return "Pendente";
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-16 bg-card border-r border-border flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="mb-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex flex-col space-y-2">
          <Button variant="ghost" size="icon" onClick={handleNewChat}>
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sidebar-transition w-80 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">FinanceAI</h1>
                <p className="text-sm text-muted-foreground">Análise de Crédito Inteligente</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <span className="material-icon text-primary-foreground text-xl">person</span>
            </div>
            <div>
              <p className="font-medium text-foreground">
                {user?.firstName && user?.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user?.username || "Usuário"}
              </p>
              <p className="text-sm text-muted-foreground">Consultor Financeiro</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center space-x-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Relatórios</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* New Chat Button */}
        <div className="px-4 pb-4">
          <Button
            onClick={handleNewChat}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Nova Conversa
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-hidden">
          <div className="px-4 pb-3">
            <h3 className="text-sm font-medium text-foreground">Conversas Recentes</h3>
          </div>
          
          <ScrollArea className="flex-1 px-4">
            <div className="space-y-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversation?.id === conversation.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => selectConversation(conversation.id)}
                >
                  <p className="text-sm font-medium text-foreground">
                    {truncateText(conversation.title || "Conversa sem título", 30)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(conversation.updatedAt)}
                  </p>
                  <div className="flex items-center mt-2">
                    <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(conversation.status)}`}></div>
                    <span className="text-xs text-muted-foreground">
                      {getStatusText(conversation.status)}
                    </span>
                  </div>
                </div>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                  <p className="text-xs">Inicie uma nova conversa acima</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Settings Button */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => setShowSettings(true)}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5 mr-3" />
            <span>Configurações</span>
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
