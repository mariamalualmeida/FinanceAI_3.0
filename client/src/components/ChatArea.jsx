import { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'

export default function ChatArea({ darkMode, toggleSidebar, isSidebarOpen, currentChatId }) {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const messagesEndRef = useRef(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0) return

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Upload de arquivos se houver
      if (files.length > 0) {
        setUploadProgress(0)
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        if (text.trim()) formData.append('message', text.trim())

        // Simular progresso de upload
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        // Simular resposta com análise de arquivo
        setTimeout(() => {
          setUploadProgress(100)
          setTimeout(() => {
            setUploadProgress(null)
            const aiMessage = {
              id: Date.now() + 1,
              sender: 'assistant',
              text: `Análise concluída! Processsei ${files.length} arquivo(s):\n\n${files.map(f => `📄 **${f.name}**`).join('\n')}\n\n**Resumo da Análise Financeira:**\n- Transações analisadas: 247\n- Score de crédito estimado: 742\n- Padrões de risco identificados: Baixo\n- Recomendações: Portfolio bem diversificado\n\n*Esta é uma análise simulada. Em breve será conectada ao sistema real de IA financeira.*`,
              timestamp: new Date()
            }
            setMessages(prev => [...prev, aiMessage])
            setIsTyping(false)
          }, 500)
        }, 2000)
      } else {
        // Resposta apenas texto
        setTimeout(() => {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `Recebi sua consulta: "${text}"\n\n**Análise Preliminar:**\nSou um assistente especializado em análise financeira e consultoria de crédito. Posso ajudar com:\n\n• 📊 Análise de extratos bancários\n• 💳 Avaliação de score de crédito\n• 🔍 Detecção de padrões suspeitos\n• 📈 Consultoria em investimentos\n• ⚠️ Análise de riscos\n\nPara uma análise mais detalhada, envie seus documentos financeiros (PDF, Excel, CSV).`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          setIsTyping(false)
        }, 1000 + Math.random() * 2000)
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      setIsTyping(false)
      setUploadProgress(null)
    }
  }

  return (
    <main className="flex flex-col flex-1 min-w-0 bg-white dark:bg-[#343541]">
      {/* Header estilo ChatGPT */}
      <header className="relative z-10 flex items-center justify-center p-4 border-b border-white/20 bg-white dark:bg-[#343541]">
        <div className="absolute left-4 md:left-4">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            ChatGPT
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">4o</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gray-400">
            <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="absolute right-4">
          <button className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Área de mensagens */}
      <section className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Tela inicial exatamente como ChatGPT
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-gray-900 dark:text-white">
                Por onde começamos?
              </h1>
            </div>
          </div>
        ) : (
          // Lista de mensagens
          <div className="w-full">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
              />
            ))}
            
            {/* Progresso de upload */}
            {uploadProgress !== null && (
              <div className="w-full border-b border-black/10 dark:border-gray-900/50 bg-gray-50 dark:bg-[#444654]">
                <div className="flex gap-4 px-4 py-6 max-w-3xl mx-auto">
                  <div className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-white text-sm font-bold bg-[#ab68ff]">
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 dark:text-gray-100">
                      <p className="mb-2">Processando arquivos...</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{uploadProgress}% concluído</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Indicador de digitação */}
            {isTyping && uploadProgress === null && (
              <MessageBubble 
                message={{
                  id: 'typing',
                  sender: 'assistant',
                  text: 'Analisando...',
                  timestamp: new Date()
                }}
                isTyping={true}
              />
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* Área de input */}
      <footer className="border-t border-white/20 p-4">
        <InputArea onSend={sendMessage} />
      </footer>
    </main>
  )
}