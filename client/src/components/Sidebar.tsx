import { useState } from 'react'
import { Plus, MessageSquare, Settings, LogOut, User, Shield } from 'lucide-react'
import AdminPanel from './AdminPanel'

interface Conversation {
  id: string
  title: string
  updatedAt: string
}

interface SidebarProps {
  user: any
  conversations: Conversation[]
  activeConversationId: string | null
  isOpen: boolean
  onClose: () => void
  onNewChat: () => void
  onSelectConversation: (id: string) => void
  onShowSettings: () => void
  onLogout: () => void
}

export default function Sidebar({
  user,
  conversations = [],
  activeConversationId,
  isOpen,
  onClose,
  onNewChat,
  onSelectConversation,
  onShowSettings,
  onLogout
}: SidebarProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  const isAdmin = user?.role === 'admin' || user?.username === 'Leonardo'

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return 'Hoje'
    } else if (diffDays === 1) {
      return 'Ontem'
    } else if (diffDays < 7) {
      return `${diffDays} dias atrás`
    } else {
      return date.toLocaleDateString('pt-BR')
    }
  }

  const truncateTitle = (title: string, maxLength: number = 30) => {
    if (title.length <= maxLength) return title
    return title.substring(0, maxLength) + '...'
  }

  return (
    <>
      <div className={`financeai-sidebar ${isOpen ? 'financeai-sidebar--open' : ''}`}>
        {/* Header */}
        <div className="financeai-sidebar__header">
          <button onClick={onNewChat} className="financeai-sidebar__new-chat">
            <Plus size={20} />
            <span>Nova Conversa</span>
          </button>
        </div>

        {/* Conversas */}
        <div className="financeai-sidebar__conversations">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`financeai-sidebar__conversation ${
                activeConversationId === conversation.id ? 'financeai-sidebar__conversation--active' : ''
              }`}
            >
              <MessageSquare size={16} />
              <div className="financeai-truncate">
                <div className="financeai-truncate">{truncateTitle(conversation.title)}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>{formatDate(conversation.updatedAt)}</div>
              </div>
            </button>
          ))}
          
          {conversations.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontSize: '14px' }}>Nenhuma conversa ainda</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="financeai-sidebar__footer">
          {/* Perfil do usuário */}
          <div className="financeai-sidebar__profile">
            <div className="financeai-sidebar__avatar">
              <User size={16} />
            </div>
            <div className="financeai-sidebar__user-info">
              <div className="financeai-sidebar__username">{user?.username || 'Usuário'}</div>
              <div className="financeai-sidebar__email">{user?.email || 'email@exemplo.com'}</div>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="financeai-sidebar__actions">
            {isAdmin && (
              <button onClick={() => setShowAdminPanel(true)} className="financeai-sidebar__action">
                <Shield size={16} />
                <span>Painel Admin</span>
              </button>
            )}
            
            <button onClick={onShowSettings} className="financeai-sidebar__action">
              <Settings size={16} />
              <span>Configurações</span>
            </button>
            
            <button onClick={onLogout} className="financeai-sidebar__action" style={{ color: 'var(--text-muted)' }}>
              <LogOut size={16} />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Componente AdminPanel */}
        {showAdminPanel && isAdmin && (
          <AdminPanel 
            onClose={() => setShowAdminPanel(false)} 
            user={user}
          />
        )}
      </div>
    </>
  )
}