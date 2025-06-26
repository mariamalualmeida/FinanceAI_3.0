import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message, isTyping = false }) {
  const isUser = message.sender === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group w-full border-b border-black/10 dark:border-gray-900/50 ${
        isUser 
          ? 'bg-white dark:bg-[#343541]' 
          : 'bg-gray-50 dark:bg-[#444654]'
      }`}
    >
      <div className={`flex gap-4 px-4 py-6 max-w-3xl mx-auto ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-white text-sm font-bold ${
          isUser 
            ? 'bg-[#19c37d]' 
            : 'bg-[#ab68ff]'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Mensagem */}
        <div className="flex-1 min-w-0">
          {isTyping ? (
            <div className="flex items-center gap-1 py-2">
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
            <div className={`prose prose-sm max-w-none dark:prose-invert text-gray-900 dark:text-gray-100 ${
              isUser ? 'text-right' : 'text-left'
            }`}>
              <ReactMarkdown>{message.text}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}