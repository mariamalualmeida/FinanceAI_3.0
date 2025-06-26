import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-white dark:bg-[#343541] text-black dark:text-white overflow-hidden">
        <Sidebar 
          darkMode={darkMode} 
          setDarkMode={setDarkMode}
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
        />
        <ChatArea 
          darkMode={darkMode}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>
    </div>
  )
}