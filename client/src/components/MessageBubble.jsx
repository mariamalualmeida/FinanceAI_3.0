import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { User, Bot } from 'lucide-react'

export default function MessageBubble({ message, isTyping = false }) {
  const isUser = message.sender === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-600 text-white' 
          : 'bg-green-600 text-white'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Mensagem */}
      <div className={`flex-1 max-w-[70%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div className={`inline-block p-4 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white ml-auto'
            : 'bg-gray-100 dark:bg-[#40414F] text-gray-900 dark:text-gray-100'
        }`}>
          {isTyping ? (
            <div className="flex items-center gap-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="w-2 h-2 bg-gray-400 rounded-full"
              />
            </div>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          )}
        </div>
        
        {/* Timestamp */}
        {!isTyping && (
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {message.timestamp?.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}