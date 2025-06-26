import { useState, useEffect } from 'react'
import { Sun, Moon, Plus, Settings, User, HelpCircle, MessageSquare, MoreHorizontal, Edit, Trash2, Archive, Search, Monitor, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchModal from './SearchModal'

export default function Sidebar({ user, onLogout, settings, onUpdateSettings, isOpen, onToggle, onClose }) {
  const [conversations, setConversations] = useState([])
  const [currentChatId, setCurrentChatId] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(null)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempUserName, setTempUserName] = useState(settings.userName || '')

  // Load conversations
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const response = await fetch('/api/conversations', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
    }
  }

  const onNewChat = () => {
    setCurrentChatId(null)
    window.location.reload() // Temporary solution
  }

  const onSelectChat = (chatId) => {
    setCurrentChatId(chatId)
    // Navigate to chat
  }

  const onDeleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        loadConversations()
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
        className="fixed md:relative z-40 flex flex-col w-64 h-full bg-[#202123] md:flex"
      >
        {/* Header com botão fechar e nova conversa */}
        <div className="flex items-center justify-between p-3">
          <button 
            onClick={() => {
              onNewChat?.()
            }}
            className="flex items-center gap-3 flex-1 p-3 mr-2 rounded-md hover:bg-gray-500/10 text-white transition-colors text-sm"
          >
            <Plus size={16} />
            Nova conversa
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-500/10 rounded-md text-white transition-colors"
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
            className="flex items-center gap-3 w-full p-3 rounded-md text-gray-300 hover:bg-gray-500/10 transition-colors text-sm"
          >
            <Search size={16} />
            Buscar conversas...
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-0">
            {conversations?.map((conv, index) => (
              <div
                key={conv.id || `conversation-${index}`}
                onClick={() => {
                  onSelectChat?.(conv.id)
                }}
                className={`group relative flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                  currentChatId === conv.id 
                    ? 'bg-gray-500/20 text-white' 
                    : 'text-gray-300 hover:bg-gray-500/10'
                }`}
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate font-medium">{conv.title}</p>
                  <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(showDropdown === conv.id ? null : conv.id)
                    }}
                    className="p-1 hover:bg-gray-500/20 rounded text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal size={16} />
                  </button>

                  {/* Dropdown menu */}
                  {showDropdown === conv.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-gray-700 rounded-md border border-gray-600 shadow-lg z-50">
                      <button 
                        onClick={() => {
                          // Implementar funcionalidade de renomear
                          const newName = prompt('Novo nome da conversa:', conv.title)
                          if (newName && newName.trim()) {
                            console.log('Renomeando conversa:', conv.id, 'para:', newName)
                            // Aqui seria atualizado o estado das conversas
                          }
                          setShowDropdown(null)
                        }}
                        className="w-full text-left p-2 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors rounded text-sm flex items-center gap-2"
                      >
                        <Edit size={14} />
                        Renomear
                      </button>
                      <button 
                        onClick={() => {
                          console.log('Arquivando conversa:', conv.id)
                          // Implementar funcionalidade de arquivar
                          setShowDropdown(null)
                        }}
                        className="w-full text-left p-2 hover:bg-gray-600 text-gray-300 hover:text-white transition-colors rounded text-sm flex items-center gap-2"
                      >
                        <Archive size={14} />
                        Arquivar
                      </button>
                      <button 
                        onClick={() => {
                          onDeleteConversation(conv.id)
                          setShowDropdown(null)
                        }}
                        className="w-full text-left p-2 hover:bg-red-600 text-red-400 hover:text-white transition-colors rounded text-sm flex items-center gap-2"
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
        <div className="border-t border-gray-600 px-2 py-2">
          <div className="relative">
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-500/10 text-gray-300 transition-colors text-sm"
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
                  className="mt-1 bg-gray-700 rounded-md border border-gray-600 overflow-hidden"
                >
                  <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-3 w-full p-3 hover:bg-gray-600 text-gray-300 transition-colors text-sm"
                  >
                    <Settings size={16} />
                    Configurações
                  </button>
                  <button 
                    onClick={() => {
                      onUpdateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
                    }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-gray-600 text-gray-300 transition-colors text-sm"
                  >
                    {settings.theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {settings.theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
                  </button>
                  <button 
                    onClick={() => {
                      const newInterface = settings.interface === 'chatgpt' ? 'gemini' : 'chatgpt'
                      onUpdateSettings({ interface: newInterface })
                    }}
                    className="flex items-center gap-3 w-full p-3 hover:bg-gray-600 text-gray-300 transition-colors text-sm"
                  >
                    {settings.interface === 'chatgpt' ? <Zap size={16} /> : <Monitor size={16} />}
                    {settings.interface === 'chatgpt' ? 'Interface Gemini' : 'Interface ChatGPT'}
                  </button>
                  <div className="border-t border-gray-600 my-1" />
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-3 w-full p-3 hover:bg-red-600 text-gray-300 transition-colors text-sm"
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

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Configurações
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Nome do usuário */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome para tratamento personalizado
                  </label>
                  <input
                    type="text"
                    value={tempUserName}
                    onChange={(e) => setTempUserName(e.target.value)}
                    placeholder="Como a IA deve te chamar?"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

  

                {/* Interface */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Estilo da Interface
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onUpdateSettings({ interface: 'chatgpt' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                        settings.interface === 'chatgpt'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Monitor size={16} />
                      ChatGPT
                    </button>
                    <button
                      onClick={() => onUpdateSettings({ interface: 'gemini' })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md border ${
                        settings.interface === 'gemini'
                          ? 'bg-purple-50 border-purple-500 text-purple-700'
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Zap size={16} />
                      Gemini
                    </button>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      onUpdateSettings({ userName: tempUserName })
                      setShowSettings(false)
                    }}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => {
                      setTempUserName(settings.userName || '')
                      setShowSettings(false)
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}