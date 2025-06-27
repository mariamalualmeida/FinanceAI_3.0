import { useState, useEffect } from 'react'
import { Sun, Moon, Plus, Settings, User, MessageSquare, MoreHorizontal, Edit, Trash2, Archive, Search, Monitor, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchModal from './SearchModal'

interface SidebarProps {
  user: any;
  onLogout: () => Promise<void>;
  settings: { theme: string; interface: string };
  onUpdateSettings: (newSettings: any) => void;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
}

export default function Sidebar({ user, onLogout, settings, onUpdateSettings, isOpen, onToggle, onClose, onOpenSettings }: SidebarProps) {
  const [conversations, setConversations] = useState<any[]>([])
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState<string | null>(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)


  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setConversations(data || [])
      } else if (response.status === 401) {
        // User not authenticated, conversations list should be empty
        setConversations([])
      } else {
        console.error('Failed to load conversations:', response.status)
        setConversations([])
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      setConversations([])
    }
  }

  const onNewChat = () => {
    setCurrentChatId(null)
    // Clear current conversation in parent component instead of reloading
    if (onClose) onClose()
  }

  const onSelectChat = (chatId: string) => {
    setCurrentChatId(chatId)
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768 && onClose) {
      onClose()
    }
    // TODO: Implement chat loading logic when backend supports it
  }

  const onDeleteConversation = async (conversationId: string) => {
    // Validar se o ID é válido
    if (!conversationId || conversationId === null || conversationId === undefined) {
      console.warn('Tentativa de excluir conversa com ID inválido:', conversationId)
      return
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        loadConversations()
      } else {
        console.error('Erro na resposta do servidor:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
    }
  }

  return (
    <>
      {/* Overlay para mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/60 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed md:relative z-40 flex flex-col w-full md:w-64 bg-white dark:bg-[#202123] border-r border-gray-200 dark:border-gray-700 h-full md:h-screen"
      >
        {/* Header com botão fechar e nova conversa */}
        <div className="flex items-center justify-between p-3">
          <button 
            onClick={() => {
              onNewChat?.()
            }}
            className="flex items-center gap-3 flex-1 p-3 mr-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-500/10 text-gray-900 dark:text-white transition-colors text-sm"
          >
            <Plus size={16} />
            Nova conversa
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-500/10 rounded-md text-gray-900 dark:text-white transition-colors"
            aria-label="Fechar sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Buscar conversas */}
        <div className="px-2 pb-2">
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-3 w-full p-3 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500/10 transition-colors text-sm"
          >
            <Search size={16} />
            Buscar conversas...
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto px-2 min-h-0">
          <div className="space-y-0">
            {conversations?.map((conv, index) => (
              <div
                key={conv.id || `conversation-fallback-${Date.now()}-${index}`}
                onClick={() => {
                  onSelectChat?.(conv.id)
                }}
                className={`group relative flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                  currentChatId === conv.id 
                    ? 'bg-gray-200 dark:bg-gray-500/20 text-gray-900 dark:text-white' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500/10'
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{conv.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{conv.lastMessage}</p>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(showDropdown === conv.id ? null : conv.id)
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-500/20 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {/* Dropdown menu */}
                  {showDropdown === conv.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 shadow-lg z-50">
                      <button 
                        key={`rename-${conv.id}-${index}`}
                        onClick={async () => {
                          const newName = prompt('Novo nome da conversa:', conv.title)
                          if (newName && newName.trim()) {
                            try {
                              const response = await fetch(`/api/conversations/${conv.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ title: newName.trim() })
                              })
                              if (response.ok) {
                                loadConversations()
                              }
                            } catch (error) {
                              console.error('Error renaming conversation:', error)
                            }
                          }
                          setShowDropdown(null)
                        }}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded text-sm flex items-center gap-2"
                      >
                        <Edit size={14} />
                        Renomear
                      </button>
                      <button 
                        key={`archive-${conv.id}-${index}`}
                        onClick={() => {
                          console.log('Arquivando conversa:', conv.id)
                          // Implementar funcionalidade de arquivar
                          setShowDropdown(null)
                        }}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors rounded text-sm flex items-center gap-2"
                      >
                        <Archive size={14} />
                        Arquivar
                      </button>
                      <button 
                        key={`delete-${conv.id}-${index}`}
                        onClick={() => {
                          if (conv.id && confirm('Tem certeza que deseja excluir esta conversa?')) {
                            onDeleteConversation(conv.id)
                          }
                          setShowDropdown(null)
                        }}
                        className="w-full text-left p-2 hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white transition-colors rounded text-sm flex items-center gap-2"
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Perfil */}
        <div className="profile-section border-t px-2 py-2 flex-shrink-0 mt-auto sticky bottom-0 z-20">
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="profile-item flex items-center gap-3 w-full rounded-md transition-colors text-minimal-base"
            >
              <User size={16} />
              Perfil
              <svg 
                className={`ml-auto w-4 h-4 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {/* Profile dropdown menu */}
            <AnimatePresence>
              {showProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="modal-consistent mt-1 rounded-md overflow-hidden"
                >
                  <button 
                    onClick={() => {
                      onOpenSettings?.()
                      setShowProfileMenu(false)
                    }}
                    className="profile-item flex items-center gap-3 w-full transition-colors text-minimal-base"
                  >
                    <Settings size={16} />
                    Configurações
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
                    }}
                    className="profile-item flex items-center gap-3 w-full transition-colors text-minimal-base"
                  >
                    {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {settings.theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                  </button>
                  <button 
                    onClick={() => {
                      onOpenAdminPanel?.()
                      setShowProfileMenu(false)
                    }}
                    className="profile-item flex items-center gap-3 w-full transition-colors text-minimal-base"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1L21 5v6c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l9-4z"/>
                    </svg>
                    Painel Admin
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                  <button 
                    onClick={onLogout}
                    className="profile-item flex items-center gap-3 w-full hover:bg-red-500 dark:hover:bg-red-600 text-red-600 dark:text-red-400 hover:text-white transition-colors text-minimal-base"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16,17 21,12 16,7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sair
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Search Modal */}
      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        conversations={conversations}
        onSelectChat={(chatId) => {
          onSelectChat(chatId)
        }}
      />


    </>
  )
}