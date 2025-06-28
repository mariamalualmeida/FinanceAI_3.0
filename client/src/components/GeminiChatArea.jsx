import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import ThemeToggle from './ThemeToggle'
import AudioRecorder from './AudioRecorder'
import InputAreaFixed from './InputAreaFixed'
import { useFileUpload } from '../hooks/useFileUpload'

export default function GeminiChatArea({ user, settings, onToggleSidebar, sidebarOpen }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [audioData, setAudioData] = useState(null)
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const { uploadFiles, uploadProgress, isUploading } = useFileUpload()

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0 && !audioData) return

    const finalText = text || (audioData?.transcription ? audioData.transcription : '')
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: finalText,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setAudioData(null)
    setIsTyping(true)

    try {
      if (files.length > 0) {
        const { success, result } = await uploadFiles(files, finalText)
        
        if (success && result.analysis) {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.analysis || 'Arquivo processado com sucesso!',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        // Enviar mensagem para a IA
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message: finalText,
            conversationId: null // TODO: implement conversation tracking
          })
        });

        if (response.ok) {
          const result = await response.json();
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.response || 'Desculpe, não consegui processar sua mensagem.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        } else {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
        setIsTyping(false)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []
    if (inputText.trim() || files.length > 0 || audioData) {
      sendMessage(inputText, files)
      
      // Limpar campos
      setInputText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0 && !inputText.trim()) {
      sendMessage('', files)
      e.target.value = ''
    }
  }

  const handleAudioReady = (audio) => {
    setAudioData(audio)
    if (audio?.transcription) {
      setInputText(audio.transcription)
    }
  }

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-screen overflow-hidden gemini-chat-container">
      {/* Gemini Header - Fundo uniforme */}
      <header className="flex items-center justify-between py-2 px-4 bg-white dark:bg-gray-900 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <>
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
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
        <div className="w-20" />
      </header>

      {/* Área de conteúdo principal - Fundo uniforme */}
      <div className="flex-1 overflow-y-auto relative" style={{ paddingBottom: '200px' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            {/* Logo central */}
            <div className="mb-8">
              <svg width="64" height="64" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
                <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            
            {/* Saudação minimalista */}
            <div className="text-center">
              <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                Olá
              </h1>
              {user && (
                <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {user.username}
                </h2>
              )}
              <p className="text-base text-gray-600 dark:text-gray-400">
                Como posso ajudá-lo hoje?
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 pb-48 messages-container">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} isGemini={true} />
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" className="text-white">
                    <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {uploadProgress !== null && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">↗</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">Enviando arquivo...</p>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
        
        {/* Área de input corrigida */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <InputAreaFixed 
            onSend={sendMessage}
            onFileUpload={(file) => {
              // Upload simples sem quebrar a interface
              console.log('Arquivo anexado:', file.name)
            }}
            isProcessing={isTyping}
            uploadProgress={uploadProgress ? { progress: uploadProgress, fileName: 'Processando...' } : null}
          />
        </div>
      </div>
    </main>
  )
}