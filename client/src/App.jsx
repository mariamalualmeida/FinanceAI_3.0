import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import Toast from './components/Toast'
import { useToast } from './hooks/useToast'

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : true
  })
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentChatId, setCurrentChatId] = useState(null)
  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: 'Análise Financeira Pessoal',
      lastMessage: 'Baseado nos seus dados...',
      timestamp: new Date()
    },
    {
      id: 2,
      title: 'Score de Crédito',
      lastMessage: 'Seu score atual é...',
      timestamp: new Date()
    },
    {
      id: 3,
      title: 'Planejamento de Investimentos',
      lastMessage: 'Para diversificar...',
      timestamp: new Date()
    }
  ])
  const { toasts, removeToast, success, error, info } = useToast()

  // Persist dark mode preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

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
        success('Nova conversa iniciada')
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
    success('Conversa excluída')
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