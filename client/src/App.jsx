import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [currentChatId, setCurrentChatId] = useState(null)

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  const handleNewChat = () => {
    setCurrentChatId(null)
  }

  const handleSelectChat = (chatId) => {
    setCurrentChatId(chatId)
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
        />
      </div>
    </div>
  )
}