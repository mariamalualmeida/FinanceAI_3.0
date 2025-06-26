import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'

export default function App() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <div className={`${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-white dark:bg-[#1e1e1e] text-black dark:text-white">
        <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} />
        <ChatArea />
      </div>
    </div>
  )
}
