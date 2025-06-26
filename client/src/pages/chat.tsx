import { useEffect } from "react";
import { useParams } from "wouter";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  const params = useParams();
  const conversationId = params.conversationId;
  const { selectConversation, currentConversation } = useChat();

  useEffect(() => {
    if (conversationId && conversationId !== currentConversation?.id) {
      selectConversation(conversationId);
    }
  }, [conversationId, currentConversation?.id, selectConversation]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <TopBar />

        {/* Chat Interface */}
        <ChatInterface />
      </div>
    </div>
  );
}
