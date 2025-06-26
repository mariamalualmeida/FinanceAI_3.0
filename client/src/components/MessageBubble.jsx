import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import TypingIndicator from './TypingIndicator'

export default function MessageBubble({ message, isTyping = false }) {
  const isUser = message.sender === 'user'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group w-full transition-all duration-300 ${
        isUser 
          ? 'bg-gradient-to-r from-transparent via-blue-50/20 to-transparent dark:from-transparent dark:via-blue-900/10 dark:to-transparent' 
          : 'bg-gradient-to-r from-transparent via-gray-50/30 to-transparent dark:from-transparent dark:via-gray-700/20 dark:to-transparent'
      }`}
    >
      <div className={`flex gap-4 px-4 py-8 max-w-4xl mx-auto ${
        isUser ? 'flex-row-reverse' : 'flex-row'
      }`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg transition-all duration-300 hover:scale-105 ${
          isUser 
            ? 'bg-gradient-to-br from-green-400 to-green-600' 
            : 'bg-gradient-to-br from-purple-500 to-indigo-600'
        }`}>
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Mensagem */}
        <div className={`flex-1 min-w-0 ${isUser ? 'flex justify-end' : ''}`}>
          {isTyping ? (
            <TypingIndicator />
          ) : (
            <div 
              className={`text-gray-900 dark:text-gray-100 ${isUser ? 'max-w-2xl' : 'max-w-full'}`}
              style={{
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
            >
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
              <div 
                className={`prose prose-sm max-w-none dark:prose-invert text-gray-800 dark:text-gray-200 leading-relaxed break-text ${
                  isUser ? 'text-right' : 'text-left'
                }`}
              >
                <ReactMarkdown 
                  components={{
                    p: ({ children }) => (
                      <p className="break-text m-0">
                        {children}
                      </p>
                    ),
                    div: ({ children }) => (
                      <div className="break-text">
                        {children}
                      </div>
                    ),
                    span: ({ children }) => (
                      <span className="break-text">
                        {children}
                      </span>
                    )
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>

              {/* Timestamp */}
              {!isTyping && (
                <div className={`text-xs text-gray-400 dark:text-gray-500 mt-3 opacity-0 group-hover:opacity-70 transition-all duration-300 ${
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