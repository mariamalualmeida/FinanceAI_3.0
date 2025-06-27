import { useState } from 'react'
import { Plus, MessageSquare, Settings, LogOut, User, Shield } from 'lucide-react'

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
    <div className={`financeai-sidebar ${isOpen ? 'financeai-sidebar--open' : ''}`}>
      {/* Header */}
      <div className="financeai-sidebar__header">
        <button onClick={onNewChat} className="financeai-sidebar__new-chat">
          <Plus size={20} />
          <span>Nova Conversa</span>
        </button>
      </div>

          {/* Conversas */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeConversationId === conversation.id
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <MessageSquare size={16} className="flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {truncateTitle(conversation.title)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(conversation.updatedAt)}
                    </div>
                  </div>
                </button>
              ))}
              
              {conversations.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma conversa ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer com perfil e configurações */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Perfil do usuário */}
            <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user?.username || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email || 'email@exemplo.com'}
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-1">
              {isAdmin && (
                <button
                  onClick={() => setShowAdminPanel(true)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Shield size={16} />
                  <span className="text-sm">Painel Admin</span>
                </button>
              )}
              
              <button
                onClick={onShowSettings}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
              >
                <Settings size={16} />
                <span className="text-sm">Configurações</span>
              </button>
              
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition-colors text-red-600 dark:text-red-400"
              >
                <LogOut size={16} />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}