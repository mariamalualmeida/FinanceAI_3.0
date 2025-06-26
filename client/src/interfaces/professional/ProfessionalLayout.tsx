import { useState } from "react";
import { ProfessionalSidebar } from "./ProfessionalSidebar";
import { ProfessionalChatInterface } from "./ProfessionalChatInterface";

interface ProfessionalLayoutProps {
  conversationId?: string;
}

export function ProfessionalLayout({ conversationId }: ProfessionalLayoutProps) {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 p-4">
      <div className="flex w-full max-w-7xl h-[95vh] rounded-lg overflow-hidden shadow-2xl bg-gray-800">
        {/* Sidebar */}
        <ProfessionalSidebar />
        
        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-700">
          <ProfessionalChatInterface conversationId={conversationId} />
        </main>
      </div>
    </div>
  );
}