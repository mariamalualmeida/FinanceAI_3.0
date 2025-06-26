import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Login from './components/Login'

const queryClient = new QueryClient()

function AppContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        });
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.log('Not authenticated');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white dark:bg-[#343541]">
        <div className="text-gray-600 dark:text-gray-300">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-[#343541] text-gray-900 dark:text-white">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatArea toggleSidebar={toggleSidebar} toast={toast} />
      </div>
      
      <Toaster />
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to toggle sidebar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSidebarOpen(prev => !prev)
      }
      
      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        handleNewChat()
      }

      // Escape to close sidebar
      if (e.key === 'Escape' && isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen, success])

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
  }

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId)
  }

  const handleDeleteConversation = (chatId) => {
    setConversations(prev => prev.filter(conv => conv.id !== chatId))
    if (currentChatId === chatId) {
      setCurrentChatId(null)
    }
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#343541] text-black dark:text-white overflow-hidden">
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          onNewChat={handleNewChat}
          currentChatId={currentChatId}
          onSelectChat={handleSelectChat}
          conversations={conversations}
          onDeleteConversation={handleDeleteConversation}
        />
        <ChatArea 
          darkMode={darkMode}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
          currentChatId={currentChatId}
          toast={{ success, error, info }}
        />

        {/* Toast notifications */}
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}