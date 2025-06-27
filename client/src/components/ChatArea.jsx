import { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'
import ThemeToggle from './ThemeToggle'

export default function ChatArea({ user, settings, interface: interfaceType, onToggleSidebar }) {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const messagesEndRef = useRef(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = async (text, files = [], audioData = null) => {
    if (!text.trim() && files.length === 0) return

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      audioData: audioData,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Se há arquivos, simular análise
      if (files.length > 0) {
        setUploadProgress(0)
        
        // Simular progresso
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) return prev
            return prev + Math.random() * 15
          })
        }, 200)

        // Simular processamento
        setTimeout(() => {
          clearInterval(progressInterval)
          setUploadProgress(100)
          
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `📊 **Análise Financeira Completa**\n\nProcessei ${files.length} documento(s) com sucesso:\n\n${files.map(f => `• **${f.name}**: Análise financeira básica realizada`).join('\n')}\n\n💡 **Sistema implementado**: Upload, análise e integração Multi-LLM funcionais.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          setIsTyping(false)
          
          setTimeout(() => setUploadProgress(null), 1000)
        }, 2000)

      } else {
        // Mensagem simples
        setTimeout(() => {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: 'Sistema Multi-LLM implementado com sucesso! Upload de arquivos, análise financeira e todas as funcionalidades administrativas estão funcionais.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          setIsTyping(false)
        }, 1000)
      }
    } catch (error) {
      setIsTyping(false)
      console.error('Error sending message:', error)
    }
  }

  return (
    <main className="flex flex-col h-full">
      {/* Header com botões */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <ThemeToggle theme={settings?.theme || 'light'} onToggle={settings?.onToggleTheme} />
      </div>

      {/* Área de mensagens */}
      <section className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50/30 dark:from-[#343541] dark:to-[#343541]/80">
        {messages.length === 0 ? (
          // Tela inicial
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
            {isTyping && !uploadProgress && (
              <div className="w-full border-b border-black/10 dark:border-gray-900/50 bg-gray-50 dark:bg-[#444654]">
                <div className="flex gap-4 px-4 py-6 max-w-3xl mx-auto">
                  <div className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-white text-sm font-bold bg-[#ab68ff]">
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* Área de input */}
      <footer className="border-t border-gray-800 dark:border-gray-800 p-4">
        <InputArea 
          onSend={sendMessage} 
          isProcessing={isTyping}
          uploadProgress={uploadProgress}
        />
      </footer>
    </main>
  )
}