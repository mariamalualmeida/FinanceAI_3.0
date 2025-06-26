import { useState, useRef, useEffect } from 'react'
import { Send, Paperclip, Mic, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function InputArea({ onSend, onFileUpload }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }, [text])

  const handleSend = () => {
    if (!text.trim() && files.length === 0) return
    console.log('Enviando texto:', text)
    console.log('Comprimento:', text.length)
    console.log('Tem quebras:', text.includes('\n'))
    onSend(text, files)
    setText('')
    setFiles([])
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files)
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ['.pdf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png', '.txt']
    
    const validFiles = selectedFiles.filter(file => {
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
      
      if (file.size > maxSize) {
        toast?.error(`Arquivo ${file.name} é muito grande (máx: 10MB)`)
        return false
      }
      
      if (!allowedTypes.includes(fileExtension)) {
        toast?.error(`Tipo de arquivo ${fileExtension} não suportado`)
        return false
      }
      
      return true
    })

    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true)
      
      // Simulate recording for demo
      setTimeout(() => {
        setIsRecording(false)
      }, 3000)
    } else {
      // Stop recording
      setIsRecording(false)
    }
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
        {/* Arquivos anexados */}
        {files.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg">
                <Paperclip size={14} />
                <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                <button 
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Container do input */}
        <div className="flex items-end gap-3 p-3 bg-white dark:bg-[#40414F] border border-gray-300 dark:border-white/20 rounded-xl shadow-sm focus-within:shadow-md transition-all">
          
          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Botão de anexo */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
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
            className="flex-1 bg-transparent border-0 outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 min-h-[24px] max-h-[200px] leading-6 py-1 whitespace-pre-wrap"
            rows={1}
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          />

          {/* Botões de ação */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Botão de microfone */}
            <motion.button
              type="button"
              onClick={toggleRecording}
              whileTap={{ scale: 0.95 }}
              className={`p-2 transition-all duration-200 rounded-xl backdrop-blur-sm ${
                isRecording 
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}
              title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
            >
              {isRecording ? (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Mic size={20} />
                </motion.div>
              ) : (
                <Mic size={20} />
              )}
            </motion.button>

            {/* Botão de enviar */}
            <motion.button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() && files.length === 0}
              whileTap={{ scale: 0.95 }}
              className={`p-2 rounded-lg transition-colors ${
                text.trim() || files.length > 0
                  ? 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              title="Enviar mensagem"
            >
              <Send size={20} />
            </motion.button>
          </div>
        </div>

        {/* Dica de atalho */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Enter para enviar • Shift + Enter para nova linha • Ctrl + K para abrir/fechar sidebar • Ctrl + N para nova conversa
        </div>
      </div>
    </div>
  )
}