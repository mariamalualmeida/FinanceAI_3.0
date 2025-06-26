import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, Square } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InputArea({ onSend }) {
  const [text, setText] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [text])

  const handleSend = () => {
    if (!text.trim()) return
    onSend(text)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    setIsRecording(!isRecording)
    // Aqui seria implementada a funcionalidade de gravação de áudio
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="relative">
        {/* Container do input */}
        <div className="flex items-end gap-3 p-3 bg-white dark:bg-[#40414F] border border-gray-300 dark:border-gray-600 rounded-2xl shadow-lg focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-colors">
          
          {/* Botão de anexo */}
          <button 
            type="button"
            className="flex-shrink-0 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title="Anexar arquivo"
          >
            <Paperclip size={20} />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem..."
            className="flex-1 bg-transparent border-0 outline-none resize-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 min-h-[24px] max-h-[200px] leading-6"
            rows={1}
          />

          {/* Botões de ação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botão de microfone/parar gravação */}
            <motion.button
              type="button"
              onClick={toggleRecording}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
            >
              {isRecording ? (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Square size={18} />
                </motion.div>
              ) : (
                <Mic size={20} />
              )}
            </motion.button>

            {/* Botão de enviar */}
            <motion.button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${
                text.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
              title="Enviar mensagem"
            >
              <Send size={20} />
            </motion.button>
          </div>
        </div>

        {/* Dica de atalho */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Pressione Enter para enviar, Shift + Enter para nova linha
        </div>
      </div>
    </div>
  )
}