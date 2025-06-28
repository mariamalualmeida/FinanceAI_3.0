import { motion } from 'framer-motion'
import TypingIndicator from './TypingIndicator'
import { File } from 'lucide-react'

export default function MessageBubble({ message, isTyping = false, isGemini = false }) {
  const isUser = message.sender === 'user'
  
  // Log para debug
  if (message.text) {
    console.log('Renderizando mensagem:', {
      sender: message.sender,
      textLength: message.text.length,
      hasLineBreaks: message.text.includes('\n'),
      text: message.text
    })
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full py-2 ${
        isUser ? 'justify-end' : 'justify-start pl-1'
      }`}>
      
      <div className={`flex items-start gap-3 ${
        isUser ? 'max-w-[75%] flex-row-reverse' : 'max-w-[80%] flex-row'
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
                <div className="whitespace-pre-wrap break-words">
                  {message.text}
                </div>
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