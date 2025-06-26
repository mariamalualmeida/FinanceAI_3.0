import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import MobileToggle from './components/MobileToggle'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Padrão fechado para evitar problemas iniciais

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev)
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-gray-50 dark:bg-[#343541] text-black dark:text-white overflow-hidden">
        <MobileToggle 
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <ChatArea 
          darkMode={darkMode}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </div>
  )
}