import { useState, useRef } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { motion } from 'framer-motion'
import AudioRecorder from './AudioRecorder'

export default function InputArea({ onSend, onFileUpload }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [audioData, setAudioData] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    if (!text.trim() && files.length === 0 && !audioData) return
    
    const finalText = text || (audioData?.transcription ? audioData.transcription : '')
    
    // Enviar com dados de áudio se houver
    if (audioData) {
      onSend(finalText, files, audioData)
    } else {
      onSend(finalText, files)
    }
    
    setText('')
    setFiles([])
    setAudioData(null)
  }

  const handleAudioReady = (audio) => {
    setAudioData(audio)
    if (audio?.transcription) {
      setText(audio.transcription)
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
    // Enter sem Shift = nova linha (comportamento padrão)
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

        {/* Preview de áudio usando o componente compartilhado */}
        {audioData && (
          <AudioRecorder 
            onAudioReady={handleAudioReady}
            variant="blue"
            className="mb-3"
          />
        )}

        {/* Container do input */}
        <div className="relative h-32 bg-white dark:bg-[#40414F] border border-gray-300 dark:border-white/20 rounded-xl shadow-sm focus-within:shadow-md transition-all">
          
          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Textarea - ocupa toda a área disponível */}
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Envie uma mensagem..."
            className="w-full h-full bg-transparent border-0 outline-none resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 px-3 py-3 pb-20 leading-6 text-base scrollbar-hide mobile-textarea-scroll overflow-y-auto"
            style={{
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              whiteSpace: 'pre-wrap',
              touchAction: 'manipulation',
              WebkitTouchCallout: 'none',
              WebkitUserSelect: 'text'
            }}
          />

          {/* Botão de anexo - canto inferior esquerdo */}
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-2 left-3 p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            title="Anexar arquivo"
          >
            <Paperclip size={18} />
          </button>

          {/* Botões de ação - canto inferior direito */}
          <div className="absolute bottom-2 right-3 flex items-center gap-2">
            {/* Componente de áudio */}
            <AudioRecorder 
              onAudioReady={handleAudioReady}
              variant="blue"
              size={18}
            />

            {/* Botão de envio */}
            <motion.button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() && files.length === 0 && !audioData}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-lg transition-colors ${
                text.trim() || files.length > 0 || audioData
                  ? 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              title="Enviar mensagem"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}