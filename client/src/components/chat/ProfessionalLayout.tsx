import { useState } from "react";
import { useParams } from "wouter";
import ProfessionalSidebar from "./professional/ProfessionalSidebar";
import ProfessionalChatArea from "./professional/ProfessionalChatArea";

export function ProfessionalLayout() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex justify-center items-center min-h-screen p-4" style={{ backgroundColor: '#121212' }}>
      <div className="flex w-full max-w-7xl h-[95vh] rounded-lg overflow-hidden shadow-2xl" style={{ backgroundColor: '#202124' }}>
        <ProfessionalSidebar 
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          conversationId={conversationId}
        />
        <ProfessionalChatArea 
          conversationId={conversationId}
        />
      </div>
    </div>
  );
}