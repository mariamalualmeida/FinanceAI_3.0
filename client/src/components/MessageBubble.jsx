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
            <div className="text-gray-900 dark:text-gray-100">
              {/* Arquivos anexados */}
              {message.files && message.files.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {message.files.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-lg">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                      </svg>
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Texto da mensagem */}
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>

              {/* Timestamp */}
              {!isTyping && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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