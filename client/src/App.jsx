import { useState, useEffect } from 'react'
import Login from './components/Login'
import SimpleSidebar from './components/SimpleSidebar'
import SimpleChatArea from './components/SimpleChatArea'

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check authentication on app load
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

    checkAuth()
  }, [])

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

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-gray-600">Carregando...</div>
      </div>
    )
  }

  // Login screen
  if (!user) {
    return <Login onLogin={handleLogin} />
  }

  // Main app
  return (
    <div className="flex h-screen bg-white">
      <SimpleSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col">
        <SimpleChatArea 
          toggleSidebar={toggleSidebar} 
          user={user}
        />
      </div>
    </div>
  )
}