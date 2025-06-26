import { useState, useEffect } from 'react'
import { Router, Route, Switch } from 'wouter'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea'
import GeminiChatArea from './components/GeminiChatArea'
import EnhancedChatArea from './components/EnhancedChatArea'
import AdminPanel from './components/AdminPanel'
import NewSettingsModal from './components/NewSettingsModal'
import { Toaster } from './components/ui/toaster'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    theme: 'light',
    interface: 'chatgpt', // 'chatgpt' or 'gemini'
    userName: ''
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

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
        }
      } catch (error) {
        console.log('Not authenticated')
      } finally {
        setLoading(false)
      }
    }

    const loadSettings = () => {
      const saved = localStorage.getItem('financeai-settings')
      if (saved) {
        setSettings({ ...settings, ...JSON.parse(saved) })
      }
    }

    checkAuth()
    loadSettings()
  }, [])

  const updateSettings = (newSettings) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('financeai-settings', JSON.stringify(updated))
  }

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    updateSettings({ theme: newTheme })
  }

  const handleLogin = (userData) => {
    setUser(userData)
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-screen ${settings.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Login screen
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Main app
  return (
    <Router>
      <div className={`h-screen max-h-screen overflow-hidden flex ${settings.theme === 'dark' ? 'dark' : ''}`}>
        <Switch>
          <Route path="/admin">
            <AdminPanel user={user} onLogout={handleLogout} />
          </Route>
          <Route>
            <Sidebar 
              user={user} 
              onLogout={handleLogout}
              settings={settings}
              onUpdateSettings={updateSettings}
              isOpen={sidebarOpen}
              onToggle={() => setSidebarOpen(!sidebarOpen)}
              onClose={() => setSidebarOpen(false)}
              onOpenSettings={() => setShowSettings(true)}
            />
            {settings.interface === 'gemini' ? (
              <GeminiChatArea 
                user={user}
                settings={{...settings, onToggleTheme: toggleTheme}}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />
            ) : (
              <ChatArea 
                user={user}
                settings={{...settings, onToggleTheme: toggleTheme}}
                interface={settings.interface}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />
            )}
          </Route>
        </Switch>
        <Toaster />
        
        {/* Settings Modal */}
        <NewSettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          currentTheme={settings.theme}
          onThemeChange={(theme) => updateSettings({ theme })}
          user={user}
        />
      </div>
    </Router>
  )
}