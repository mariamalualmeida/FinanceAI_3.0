import { useState, useEffect } from 'react'
import { Router, Route, Switch } from 'wouter'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import GeminiChatArea from './components/GeminiChatArea'
import { Toaster } from './components/ui/toaster'
import { initializeCleanApp } from './utils/configMigration'
import './financeai.css'

interface User {
  id: number
  username: string
  email: string
  role?: string
}

interface Conversation {
  id: string
  title: string
  updatedAt: string
}

interface Settings {
  theme: string
  interface: string
  userName?: string
  onToggleTheme?: () => void
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    theme: 'light',
    interface: 'gemini'
  })

  // Check authentication and load settings on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: 'include'
        })
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          loadConversations()
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setLoading(false)
      }
    }

    // Initialize clean app with migrated configs
    const cleanConfig = initializeCleanApp()
    setSettings({
      theme: cleanConfig.theme,
      interface: cleanConfig.interface
    })
    
    // Apply theme
    if (cleanConfig.theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    checkAuth()
  }, [])

  const handleSettingsChange = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    
    // Save to localStorage
    localStorage.setItem('financeai-settings', JSON.stringify(updated))
    
    // Apply theme changes
    if (newSettings.theme) {
      if (newSettings.theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  const handleLogin = (userData: User) => {
    setUser(userData)
    loadConversations()
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('Error logging out:', error)
    } finally {
      setUser(null)
      setConversations([])
      setActiveConversationId(null)
      setSidebarOpen(false)
    }
  }

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
        
        // Set active conversation to the most recent one
        if (data.length > 0) {
          setActiveConversationId(data[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const handleNewChat = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Nova Conversa'
        }),
        credentials: 'include'
      })
      
      if (response.ok) {
        const newConversation = await response.json()
        setConversations(prev => [newConversation, ...prev])
        setActiveConversationId(newConversation.id)
      }
    } catch (error) {
      console.error('Error creating new chat:', error)
    }
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    handleSettingsChange({ theme: newTheme })
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (loading) {
    return (
      <div className="financeai-loading">
        <div className="financeai-loading__content">
          <div className="financeai-loading__logo">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
          <div className="financeai-loading__title">FinanceAI</div>
          <div className="financeai-loading__spinner" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  const settingsWithHandlers = {
    ...settings,
    onToggleTheme: toggleTheme
  }

  return (
    <div className="financeai-app">
      {/* Overlay for mobile */}
      <div className={`financeai-overlay ${sidebarOpen ? 'financeai-overlay--visible' : ''}`} onClick={() => setSidebarOpen(false)} />
      
      <Sidebar
        user={user}
        conversations={conversations}
        activeConversationId={activeConversationId}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onSelectConversation={setActiveConversationId}
        onShowSettings={() => setShowSettings(true)}
        onLogout={handleLogout}
      />

      <GeminiChatArea
        user={user}
        settings={settingsWithHandlers}
        onToggleSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      <Toaster />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Switch>
        <Route path="*" component={AppContent} />
      </Switch>
    </Router>
  )
}