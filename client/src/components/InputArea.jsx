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

  // Textarea ref para controle
  // Auto-resize removido pois agora usa altura fixa com scroll

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

  // Estratégia dupla de áudio conforme discutido
  const transcribeAudio = async (audioBlob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (response.ok) {
        const { transcription } = await response.json()
        setTranscription(transcription)
        setText(transcription) // Preenche a caixa de texto para edição
        return transcription
      }
    } catch (error) {
      console.error('Erro na transcrição:', error)
    } finally {
      setIsTranscribing(false)
    }
    return ''
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks = []
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' })
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        
        // Transcrição automática para logs e edição
        await transcribeAudio(blob)
        
        // Parar todas as tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      } else {
        audioRef.current.play()
        setIsPlayingAudio(true)
      }
    }
  }

  const clearAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscription('')
    setIsPlayingAudio(false)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
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

        {/* Preview do áudio gravado */}
        {audioBlob && (
          <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Áudio Gravado</span>
              </div>
              <button
                onClick={clearAudio}
                className="text-gray-500 hover:text-red-500 transition-colors"
                title="Remover áudio"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={playAudio}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors"
                title={isPlayingAudio ? 'Pausar áudio' : 'Reproduzir áudio'}
              >
                {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
              </button>
              
              <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
                Clique no botão para ouvir sua gravação
              </div>
            </div>

            {isTranscribing && (
              <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Transcrevendo áudio...
              </div>
            )}

            {transcription && (
              <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
                <div className="text-xs text-gray-500 mb-1">Transcrição (editável):</div>
                <div className="italic">"{transcription}"</div>
              </div>
            )}

            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlayingAudio(false)}
              className="hidden"
            />
          </div>
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
            {/* Botão de microfone */}
            <motion.button
              type="button"
              onClick={toggleRecording}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 transition-all duration-200 rounded-xl backdrop-blur-sm ${
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
                  <Mic size={18} />
                </motion.div>
              ) : (
                <Mic size={18} />
              )}
            </motion.button>

            {/* Botão de enviar */}
            <motion.button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() && files.length === 0 && !audioBlob}
              whileTap={{ scale: 0.95 }}
              className={`p-1.5 rounded-lg transition-colors ${
                text.trim() || files.length > 0 || audioBlob
                  ? 'text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
              title="Enviar mensagem"
            >
              <Send size={18} />
            </motion.button>
          </div>
        </div>

        {/* Dica de atalho */}
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Shift + Enter para enviar • Enter para nova linha • Ctrl + K para abrir/fechar sidebar • Ctrl + N para nova conversa
        </div>
      </div>
    </div>
  )
}