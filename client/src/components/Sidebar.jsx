import { useState } from 'react'
import { Sun, Moon, Plus, Settings, User, HelpCircle, MessageSquare, MoreHorizontal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar({ darkMode, setDarkMode, isOpen, setIsOpen }) {
  const [conversations] = useState([
    { id: 1, title: 'Como melhorar produtividade', time: '2h' },
    { id: 2, title: 'Análise de dados financeiros', time: '1d' },
    { id: 3, title: 'Estratégias de marketing digital', time: '3d' },
    { id: 4, title: 'Desenvolvimento de aplicativos', time: '1s' },
    { id: 5, title: 'Inteligência artificial e ML', time: '2s' },
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
            className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
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
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={`
          fixed md:relative z-50 flex flex-col w-64 h-full
          bg-gray-900 dark:bg-[#202123] border-r border-gray-200 dark:border-gray-700
          md:translate-x-0 md:z-auto
        `}
      >
        {/* Header com botão Nova Conversa */}
        <div className="p-3">
          <button className="flex items-center gap-3 w-full p-3 rounded-lg bg-transparent border border-gray-600 hover:bg-gray-700 dark:hover:bg-gray-600 text-white transition-colors">
            <Plus size={16} />
            <span className="text-sm">Nova conversa</span>
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <div className="space-y-1">
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                whileHover={{ backgroundColor: 'rgba(64, 65, 79, 0.5)' }}
                className="group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer text-gray-100 hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
              >
                <MessageSquare size={16} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{conv.title}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-gray-400">{conv.time}</span>
                  <button className="p-1 hover:bg-gray-600 rounded">
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Menu inferior */}
        <div className="p-3 border-t border-gray-700">
          <div className="space-y-1">
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 transition-colors">
              <User size={16} />
              <span className="text-sm">Perfil</span>
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 transition-colors">
              <Settings size={16} />
              <span className="text-sm">Configurações</span>
            </button>
            <button className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 transition-colors">
              <HelpCircle size={16} />
              <span className="text-sm">Ajuda</span>
            </button>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 text-gray-100 transition-colors"
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span className="text-sm">{darkMode ? 'Modo claro' : 'Modo escuro'}</span>
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}