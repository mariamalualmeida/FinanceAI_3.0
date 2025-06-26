import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SimpleSidebar } from "./SimpleSidebar";
import { SimpleTopBar } from "./SimpleTopBar";
import { SimpleChatInterface } from "./SimpleChatInterface";

interface SimpleLayoutProps {
  conversationId?: string;
}

export function SimpleLayout({ conversationId }: SimpleLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
        fixed inset-y-0 left-0 z-50 w-64
        bg-gray-800 transition-transform duration-300 ease-in-out
        lg:relative lg:z-auto
      `}>
        <SimpleSidebar onClose={() => setIsSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <SimpleTopBar onMenuClick={() => setIsSidebarOpen(true)} />
        <SimpleChatInterface conversationId={conversationId} />
      </main>
    </div>
  );
}