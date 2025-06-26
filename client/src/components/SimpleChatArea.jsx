import { useState, useRef, useEffect } from 'react'
import { Menu, Send, Paperclip, User, Bot } from 'lucide-react'
import MessageBubble from './MessageBubble'

export default function SimpleChatArea({ toggleSidebar, toast }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Olá! Sou seu assistente de análise financeira. Posso ajudá-lo com:\n\n• Análise de extratos bancários\n• Avaliação de score de crédito\n• Detecção de padrões de gastos\n• Consultoria financeira\n\nEnvie seus documentos ou faça uma pergunta!',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      // Simple echo response for now
      setTimeout(() => {
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: `Recebi sua mensagem: "${inputText}"\n\nComo assistente especializado em análise financeira, posso ajudar com:\n\n• Análise de extratos bancários\n• Avaliação de score de crédito\n• Detecção de padrões suspeitos\n• Consultoria em investimentos\n• Análise de riscos\n\nPara uma análise detalhada, envie seus documentos financeiros.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, aiMessage])
        setIsLoading(false)
      }, 1000)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return

    setUploadProgress(0)
    
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))

      // Simulate upload progress
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer)
            return 90
          }
          return prev + 15
        })
      }, 500)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      clearInterval(progressTimer)
      setUploadProgress(100)

      const result = await response.json()

      setTimeout(() => {
        setUploadProgress(null)
        
        if (result.success) {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `✅ **Arquivo Processado com Sucesso!**\n\n📄 **Arquivo:** ${files[0].name}\n📊 **Status:** Análise em andamento\n\nEm breve você receberá um relatório completo com:\n• Score de crédito\n• Análise de risco\n• Padrões de gastos\n• Recomendações personalizadas`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          
          toast({
            title: "Sucesso",
            description: "Arquivo enviado e sendo processado",
          })
        } else {
          throw new Error(result.message || 'Erro no upload')
        }
      }, 1000)

    } catch (error) {
      setUploadProgress(null)
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload do arquivo",
        variant: "destructive",
      })
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#343541]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
        <button
          onClick={toggleSidebar}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Análise Financeira IA
        </h1>
        <div className="w-8"></div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Bot size={16} />
            <span className="text-sm">Analisando...</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}

        {uploadProgress !== null && (
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Processando arquivo...</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-600">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Paperclip size={20} />
          </button>
          
          <div className="flex-1 relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Digite sua mensagem ou envie um documento financeiro..."
              className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none"
              rows={1}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={16} />
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg"
          multiple
          onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
        />
      </div>
    </div>
  )
}