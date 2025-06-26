import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Menu } from 'lucide-react'
import MessageBubble from './MessageBubble'
import ThemeToggle from './ThemeToggle'

export default function GeminiChatArea({ user, settings, onToggleSidebar }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0) return

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      if (files.length > 0) {
        setUploadProgress(0)
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        if (text.trim()) formData.append('message', text)

        const uploadPromise = fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        const intervalId = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) return prev
            return prev + Math.random() * 10
          })
        }, 200)

        const response = await uploadPromise
        clearInterval(intervalId)
        setUploadProgress(100)

        setTimeout(() => setUploadProgress(null), 500)

        if (response.ok) {
          const result = await response.json()
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.analysis || 'Arquivo processado com sucesso!',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        // Simular resposta da IA
        setTimeout(() => {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `Recebi sua mensagem: "${text}". Como posso ajudá-lo com análise financeira?`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          setIsTyping(false)
        }, 1500)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setUploadProgress(null)
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []
    if (inputText.trim() || files.length > 0) {
      sendMessage(inputText, files)
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

  return (
    <main className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Gemini Header - Estilo minimalista */}
      <header className="flex items-center justify-between py-3 px-6 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <ThemeToggle theme={settings?.theme || 'light'} onToggle={settings?.onToggleTheme} />
          <div className="flex items-center gap-2 ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
              <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
            <span className="text-lg font-normal text-gray-800 dark:text-gray-200">Gemini</span>
          </div>
        </div>
        <div className="w-20" />
      </header>

      {/* Área de conteúdo principal - Layout Gemini autêntico */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6 py-12">
            {/* Logo central */}
            <div className="mb-8">
              <svg width="64" height="64" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
                <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            
            {/* Saudação minimalista */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-4">
                {settings.userName ? `Olá, ${settings.userName}` : 'Olá'}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Como posso ajudá-lo hoje?
              </p>
            </div>
            
            {/* Cards de sugestões - estilo Gemini */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-6xl w-full">
              {[
                {
                  title: "Analisar extrato bancário",
                  description: "Upload de documentos financeiros"
                },
                {
                  title: "Calcular score de crédito", 
                  description: "Avaliação de perfil creditício"
                },
                {
                  title: "Identificar padrões de gastos",
                  description: "Análise de comportamento financeiro"
                },
                {
                  title: "Consultoria personalizada",
                  description: "Dicas e recomendações financeiras"
                }
              ].map((card, index) => (
                <button
                  key={index}
                  onClick={() => setInputText(card.title)}
                  className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 text-left group"
                >
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {card.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {card.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
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
      </div>

      {/* Input Area - Estilo Gemini limpo */}
      <div className="p-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm focus-within:shadow-md transition-all">
              <div className="flex items-end">
                <div className="flex-1 relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Escreva uma mensagem para o Gemini...`}
                    className="w-full min-h-[52px] max-h-32 px-4 py-4 pr-12 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none border-0 outline-none"
                    rows="1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSubmit(e)
                      }
                    }}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-12 top-1/2 -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    <Paperclip size={18} />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim() && !fileInputRef.current?.files?.length}
                  className="p-3 m-1 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}