import { motion } from 'framer-motion'
import { useState } from 'react'
import TypingIndicator from './TypingIndicator'
import { File, Copy, Edit, Check, X } from 'lucide-react'

export default function MessageBubble({ message, isTyping = false, isGemini = false, onEdit, onDelete }) {
  const isUser = message.sender === 'user'
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text || '')
  const [copied, setCopied] = useState(false)
  
  // Log para debug
  if (message.text) {
    console.log('Renderizando mensagem:', {
      sender: message.sender,
      textLength: message.text.length,
      hasLineBreaks: message.text.includes('\n'),
      text: message.text
    })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditText(message.text || '')
  }

  const handleSaveEdit = () => {
    if (onEdit && editText.trim()) {
      onEdit(message.id, editText.trim())
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditText(message.text || '')
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full px-4 py-2 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}>
      
      <div className={`flex items-start gap-3 max-w-[85%] ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}>
        
        {/* Avatar - apenas para IA */}
        {!isUser && (
          <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center text-white text-sm font-bold mt-1 ${
            isGemini 
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 rounded-full'
              : `rounded-sm ${isTyping ? 'bg-gray-400 animate-pulse' : 'bg-[#ab68ff]'}`
          }`}>
            {isGemini ? 'G' : 'AI'}
          </div>
        )}

        {/* Conteúdo da mensagem */}
        <div className={`${isUser ? 'flex justify-end' : 'flex-1'}`}>
          {isTyping ? (
            <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-md">
              <TypingIndicator />
            </div>
          ) : (
            <div className={`${
              isUser 
                ? 'bg-gray-200 dark:bg-gray-700 rounded-2xl px-4 py-3 max-w-md inline-block' 
                : 'w-full'
            }`}>
              
              {/* Arquivos anexados */}
              {message.files && message.files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {message.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                      <File size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Texto da mensagem */}
              <div className={`text-gray-900 dark:text-gray-100 leading-relaxed text-sm ${
                isUser ? 'text-left' : 'text-left'
              }`}>
                {isEditing ? (
                  <div className="space-y-2">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={Math.max(3, editText.split('\n').length)}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                      >
                        <Check size={12} />
                        Salvar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                      >
                        <X size={12} />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap break-words">
                    {message.text}
                  </div>
                )}
              </div>

              {/* Timestamp */}
              {!isTyping && (
                <div className={`text-xs text-gray-400 dark:text-gray-500 mt-2 opacity-50 ${
                  isUser ? 'text-right' : 'text-left'
                }`}>
                  {message.timestamp?.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}