import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Menu, Mic, MicOff } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ThemeToggle from './ThemeToggle'

interface Message {
  id: number
  sender: 'user' | 'ai'
  text: string
  files?: Array<{ name: string; size: number; type: string }>
  timestamp: Date
}

interface GeminiChatAreaProps {
  user: any
  settings: any
  onToggleSidebar: () => void
  sidebarOpen: boolean
}

export default function GeminiChatArea({ user, settings, onToggleSidebar, sidebarOpen }: GeminiChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Auto resize da textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputText])

  // Função para enviar mensagem
  const sendMessage = async () => {
    if (!inputText.trim() && selectedFiles.length === 0) return
    if (isTyping) return

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      files: selectedFiles.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setSelectedFiles([])
    setIsTyping(true)

    try {
      // Upload de arquivos se houver
      let uploadedFiles: string[] = []
      if (selectedFiles.length > 0) {
        setUploadProgress(0)
        const formData = new FormData()
        selectedFiles.forEach(file => formData.append('files', file))

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          uploadedFiles = uploadResult.files || []
        }
        setUploadProgress(null)
      }

      // Enviar mensagem para a IA
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputText,
          files: uploadedFiles,
          conversationId: 'default'
        }),
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          text: data.response || 'Desculpe, não consegui processar sua mensagem.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
      } else {
        throw new Error('Falha na comunicação com a IA')
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        text: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  // Manipular upload de arquivos
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  // Remover arquivo selecionado
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // Iniciar gravação de áudio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks: Blob[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        await transcribeAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
    }
  }

  // Parar gravação
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Transcrever áudio
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setInputText(data.transcription || '')
      }
    } catch (error) {
      console.error('Erro na transcrição:', error)
    }
  }

  // Manipular teclas
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="main-content">
      {/* Header */}
      <header className="chat-header">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <>
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>
              <ThemeToggle theme={settings?.theme || 'light'} onToggle={settings?.onToggleTheme} />
            </>
          )}
          <div className="flex items-center gap-2 ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
              <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
            <span className="text-lg font-normal text-gray-800 dark:text-gray-200">Mig</span>
          </div>
        </div>
      </header>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="mb-8">
              <svg width="64" height="64" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
                <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
                {settings.userName ? `Olá, ${settings.userName}` : 'Olá'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Como posso ajudá-lo hoje?
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isGemini={true}
              />
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="input-area">
        {/* Arquivos selecionados */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div key={index} className="upload-progress">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress de upload */}
        {uploadProgress !== null && (
          <div className="mb-3">
            <div className="upload-progress-bar">
              <div 
                className="upload-progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Container de input */}
        <div className="input-container">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="input-button button-file"
            aria-label="Anexar arquivo"
          >
            <Paperclip size={16} />
          </button>

          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="input-textarea"
            rows={1}
          />

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`input-button button-record ${isRecording ? 'recording' : ''}`}
            aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <button
            type="button"
            onClick={sendMessage}
            disabled={!inputText.trim() && selectedFiles.length === 0}
            className="input-button button-send"
            aria-label="Enviar mensagem"
          >
            <Send size={16} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="sr-only"
        />
      </div>
    </div>
  )
}