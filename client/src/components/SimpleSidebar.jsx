import { useState } from 'react'
import { Menu, X, Plus, LogOut, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminPanel from './AdminPanel'

export default function SimpleSidebar({ isOpen, onClose, user, onLogout }) {
  return (
    <>
      {/* Mobile Overlay */}
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
        className="fixed top-0 left-0 z-40 h-full w-64 bg-gray-900 dark:bg-gray-900 text-white transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h1 className="text-lg font-semibold">FinanceAI</h1>
            <button
              onClick={onClose}
              className="md:hidden p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors">
              <Plus size={16} />
              Nova Conversa
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 px-4 pb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Conversas Recentes</h3>
            <div className="space-y-2">
              <div className="p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                <p className="text-sm font-medium">Análise Financeira</p>
                <p className="text-xs text-gray-400 truncate">Seu score de crédito...</p>
              </div>
              <div className="p-3 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                <p className="text-sm font-medium">Planejamento</p>
                <p className="text-xs text-gray-400 truncate">Vamos revisar seus...</p>
              </div>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.username || 'Usuário'}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user?.email || 'usuario@email.com'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="w-full mt-3 flex items-center gap-3 p-3 text-left hover:bg-gray-800 rounded-lg transition-colors text-sm"
            >
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}