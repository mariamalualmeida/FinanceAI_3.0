import { useState, useEffect } from 'react'
import { Router, Route, Switch } from 'wouter'
import Login from './components/Login'
import Sidebar from './components/Sidebar'
import GeminiChatArea from './components/GeminiChatArea'
import AdminPanel from './components/AdminPanel'
import CleanSettingsModal from './components/CleanSettingsModal'
import { Toaster } from './components/ui/toaster'
function AppContent() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
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
        try {
          setSettings(prev => ({ ...prev, ...JSON.parse(saved) }))
        } catch (error) {
          console.error('Failed to load settings:', error)
        }
      }
    }

    checkAuth()
    loadSettings()
  }, [])

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
    localStorage.setItem('financeai-settings', JSON.stringify({ ...settings, ...newSettings }))
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
      <div className={`w-full h-full ${settings.theme === 'dark' ? 'dark' : ''}`}>
        <Switch>
          <Route path="/admin">
            <AdminPanel user={user} onLogout={handleLogout} onClose={() => window.history.back()} />
          </Route>
          <Route>
            <div className="flex h-full w-full">
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
              <GeminiChatArea 
                user={user}
                settings={{...settings, onToggleTheme: toggleTheme}}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                sidebarOpen={sidebarOpen}
              />
            </div>
          </Route>
        </Switch>
        <Toaster />
        
        {/* Settings Modal */}
        <UnifiedSettingsModal
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

export default AppContent;