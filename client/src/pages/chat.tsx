import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  const { user, isLoading } = useAuth();
  const { currentConversation } = useChat();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auto-close sidebar on mobile when conversation changes
  useEffect(() => {
    if (currentConversation && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, [currentConversation]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(false); // Let desktop handle sidebar visibility
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0">
        {/* Top Bar - Mobile optimized */}
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} />

        {/* Chat Interface - Full height on mobile */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}