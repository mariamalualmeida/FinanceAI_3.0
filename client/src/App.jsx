import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { useToast } from '@/hooks/use-toast'
import SimpleSidebar from './components/SimpleSidebar'
import SimpleChatArea from './components/SimpleChatArea'
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
      <SimpleSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col">
        <SimpleChatArea toggleSidebar={toggleSidebar} toast={toast} />
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