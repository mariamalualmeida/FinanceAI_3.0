import { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'

export default function ChatArea({ darkMode, toggleSidebar, isSidebarOpen }) {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = (text) => {
    if (!text.trim()) return

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    // Simular resposta da IA
    setTimeout(() => {
      const aiMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `Recebi sua mensagem: "${text}". Esta é uma resposta simulada da IA. Em breve será conectada ao backend real para processamento avançado de consultas financeiras e análise de documentos.`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1000 + Math.random() * 2000)
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
            
            {/* Indicador de digitação */}
            {isTyping && (
              <MessageBubble 
                message={{
                  id: 'typing',
                  sender: 'assistant',
                  text: 'Digitando...',
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