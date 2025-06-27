import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import ThemeToggle from './ThemeToggle'
import AudioRecorder from './AudioRecorder'
import { useFileUpload } from '../hooks/useFileUpload'

export default function FixedGeminiChatArea({ user, settings, onToggleSidebar, sidebarOpen }) {
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
        // Enviar mensagem de texto normal
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: finalText })
        })

        if (response.ok) {
          const data = await response.json()
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: data.response || 'Resposta recebida',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: 'Desculpe, ocorreu um erro ao processar sua mensagem.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []
    sendMessage(inputText, files)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (event) => {
    // Não fazer nada especial, apenas deixar o arquivo selecionado
  }

  const handleAudioReady = (data) => {
    setAudioData(data)
    if (data.transcription) {
      setInputText(data.transcription)
    }
  }

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative overflow-hidden">
      {/* Header simples */}
      <header className="flex items-center justify-between py-3 px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
              <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
            <span className="text-lg font-normal text-gray-800 dark:text-gray-200">Mig</span>
          </div>
        </div>
        
        {/* Botão de tema apenas quando sidebar está fechada */}
        {!sidebarOpen && (
          <ThemeToggle theme={settings?.theme || 'light'} onToggle={settings?.onToggleTheme} />
        )}
      </header>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4" style={{ paddingBottom: '100px' }}>
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="mb-8">
              <svg width="64" height="64" viewBox="0 0 24 24" className="text-gray-400 dark:text-gray-500 mx-auto mb-4">
                <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
              <h2 className="text-2xl font-light text-gray-800 dark:text-gray-200 text-center mb-2">
                Como posso ajudar você hoje?
              </h2>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isUser={message.sender === 'user'}
                onEdit={(id, newText) => {
                  setMessages(prev => prev.map(msg => 
                    msg.id === id ? { ...msg, text: newText } : msg
                  ))
                }}
              />
            ))}
            
            {/* Indicador de digitação */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-3 max-w-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Progresso de upload */}
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
      </div>

      {/* Input área fixo na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-40">
        <div className="max-w-4xl mx-auto p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            {/* Botão de anexar */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
            >
              <Paperclip size={18} />
            </button>
            
            {/* Textarea */}
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none border-0 outline-none px-4 py-3 rounded-lg text-base focus:ring-2 focus:ring-blue-500 min-h-[44px] max-h-[120px]"
                rows={1}
                style={{
                  lineHeight: '1.4',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
              />
            </div>

            {/* Botão de áudio */}
            <div className="flex-shrink-0">
              <AudioRecorder 
                onAudioReady={handleAudioReady}
                variant="purple"
                size={16}
              />
            </div>

            {/* Botão de envio */}
            <motion.button
              type="submit"
              disabled={!inputText.trim() && !fileInputRef.current?.files?.length && !audioData}
              whileTap={{ scale: 0.95 }}
              className={`p-2.5 rounded-lg transition-colors flex-shrink-0 ${
                inputText.trim() || fileInputRef.current?.files?.length || audioData
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </motion.button>
            
            {/* Input de arquivo oculto */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png,.mp3,.wav,.m4a,.webm,.ogg"
              onChange={handleFileChange}
              className="hidden"
            />
          </form>
        </div>
      </div>
    </main>
  )
}