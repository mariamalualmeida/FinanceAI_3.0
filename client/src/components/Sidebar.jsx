import { useState } from 'react'
import { Sun, Moon, Plus, Settings, User, HelpCircle, MessageSquare, MoreHorizontal, Edit, Trash2, Archive } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar({ darkMode, setDarkMode, isOpen, setIsOpen, onNewChat, currentChatId, onSelectChat }) {
  const [conversations] = useState([
    { id: 1, title: 'Análise Financeira - Relatório Q3', lastMessage: 'Baseado nos dados...' },
    { id: 2, title: 'Avaliação de Crédito Cliente X', lastMessage: 'Score calculado: 750' },
    { id: 3, title: 'Detecção de Fraudes', lastMessage: 'Padrões suspeitos identificados' },
    { id: 4, title: 'Consultoria Investimentos', lastMessage: 'Recomendo diversificar...' },
    { id: 5, title: 'Análise de Risco Portfolio', lastMessage: 'Volatilidade moderada' },
  ])

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
            onClick={() => setIsOpen(false)}
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
        className="fixed md:relative z-40 flex flex-col w-full md:w-64 h-full bg-[#202123] md:block"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header com botão fechar e nova conversa */}
        <div className="flex items-center justify-between p-3">
          <button 
            onClick={() => {
              onNewChat?.()
              setIsOpen(false)
            }}
            className="flex items-center gap-3 flex-1 p-3 mr-2 rounded-md border border-white/20 hover:bg-gray-500/10 text-white transition-colors text-sm"
          >
            <Plus size={16} />
            Nova conversa
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-500/10 rounded-md text-white transition-colors"
            aria-label="Fechar sidebar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto px-2">
          <div className="space-y-0">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  onSelectChat?.(conv.id)
                  setIsOpen(false)
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
                      // Menu de opções
                    }}
                    className="p-1 hover:bg-gray-500/20 rounded text-gray-400 hover:text-white"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Menu inferior */}
        <div className="border-t border-white/20 p-2">
          <div className="space-y-0">
            <button className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-500/10 text-gray-300 transition-colors text-sm">
              <User size={16} />
              Perfil
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-500/10 text-gray-300 transition-colors text-sm">
              <Settings size={16} />
              Configurações
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-500/10 text-gray-300 transition-colors text-sm">
              <HelpCircle size={16} />
              Ajuda
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-3 w-full p-3 rounded-md hover:bg-gray-500/10 text-gray-300 transition-colors text-sm"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              {darkMode ? 'Modo claro' : 'Modo escuro'}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}