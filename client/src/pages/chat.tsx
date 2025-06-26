import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId;
  const { selectConversation, currentConversation } = useChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (conversationId && conversationId !== currentConversation?.id) {
      selectConversation(conversationId);
    }
  }, [conversationId, currentConversation?.id, selectConversation]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default */}
      <div className={`
        fixed lg:relative lg:translate-x-0 z-50 transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Bar */}
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        {/* Chat Interface */}
        <ChatInterface />
      </div>
    </div>
  );
}
