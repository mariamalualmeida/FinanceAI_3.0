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
      files: selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type
      })),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setSelectedFiles([])
    setIsTyping(true)

    try {
      // Simular resposta da IA por enquanto
      setTimeout(() => {
        const aiMessage: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Esta é uma resposta simulada. O sistema real de IA será integrado em breve.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        setIsTyping(false)
      }, 1500)
    } catch (error) {
      setIsTyping(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      setSelectedFiles(prev => [...prev, ...files])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
      
      mediaRecorder.start()
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="financeai-main">
      {/* Header */}
      <div className="financeai-header">
        <div className="financeai-header__left">
          <button onClick={onToggleSidebar} className="financeai-header__menu">
            <Menu size={20} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              background: 'linear-gradient(135deg, var(--color-record), var(--color-send))', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white'
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            <span className="financeai-header__title">Mig</span>
          </div>
        </div>
        
        <div className="financeai-header__right">
          <ThemeToggle 
            theme={settings.theme} 
            onToggleTheme={settings.onToggleTheme} 
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="financeai-chat">
        <div className="financeai-messages">
          {messages.length === 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'linear-gradient(135deg, var(--color-send), var(--color-record))', 
                borderRadius: '50%', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'white',
                marginBottom: '16px'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>
                Olá
              </h3>
              <p style={{ fontSize: '14px' }}>Como posso ajudá-lo hoje?</p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} isGemini={true} />
          ))}

          {isTyping && (
            <div className="financeai-message">
              <div className="financeai-message__avatar financeai-message__avatar--ai">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                </svg>
              </div>
              <div className="financeai-message__content">
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', background: 'currentColor', borderRadius: '50%', animation: 'pulse 1.4s infinite' }}></div>
                  <div style={{ width: '8px', height: '8px', background: 'currentColor', borderRadius: '50%', animation: 'pulse 1.4s infinite 0.2s' }}></div>
                  <div style={{ width: '8px', height: '8px', background: 'currentColor', borderRadius: '50%', animation: 'pulse 1.4s infinite 0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="financeai-input-area">
          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              {selectedFiles.map((file, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  padding: '8px 12px', 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '6px',
                  marginBottom: '4px'
                }}>
                  <Paperclip size={14} />
                  <span style={{ fontSize: '14px', flex: 1 }}>{file.name}</span>
                  <button onClick={() => removeFile(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
                </div>
              ))}
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress !== null && (
            <div style={{ marginBottom: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px' }}>
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>Enviando arquivo...</div>
              <div style={{ background: 'var(--border-color)', borderRadius: '4px', height: '4px' }}>
                <div style={{ 
                  background: 'var(--color-send)', 
                  height: '100%', 
                  borderRadius: '4px',
                  width: `${uploadProgress}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          )}

          {/* Input container */}
          <div className="financeai-input-container">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="financeai-input-button financeai-input-button--attach"
            >
              <Paperclip size={16} />
            </button>

            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem..."
              className="financeai-input"
              rows={1}
            />

            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`financeai-input-button financeai-input-button--record ${isRecording ? 'financeai-input-button--recording' : ''}`}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              onClick={sendMessage}
              disabled={!inputText.trim() && selectedFiles.length === 0}
              className="financeai-input-button financeai-input-button--send"
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
            className="financeai-sr-only"
          />
        </div>
      </div>
    </div>
  )
}