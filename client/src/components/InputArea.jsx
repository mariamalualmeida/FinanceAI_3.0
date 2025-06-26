import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InputArea({ onSend }) {
  const [text, setText] = useState('')
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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="relative">
        {/* Container do input */}
        <div className="flex items-end gap-3 p-3 bg-white dark:bg-[#40414F] border border-black/10 dark:border-white/20 rounded-xl shadow-sm focus-within:shadow-md transition-all">
          
          {/* Botão de anexo */}
          <button 
            type="button"
            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
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
            className="flex-1 bg-transparent border-0 outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[24px] max-h-[200px] leading-6 py-1"
            rows={1}
          />

          {/* Botões de ação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botão de microfone */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              title="Gravar áudio"
            >
              <Mic size={20} />
            </button>

            {/* Botão de enviar */}
            <motion.button
              type="button"
              onClick={handleSend}
              disabled={!text.trim()}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${
                text.trim()
                  ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
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