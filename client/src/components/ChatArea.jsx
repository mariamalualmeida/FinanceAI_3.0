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
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/20 bg-white dark:bg-[#343541]">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="hidden md:flex relative z-20 p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white items-center justify-center min-w-[40px] min-h-[40px]"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white md:ml-0 ml-16">
            ChatGPT
          </h1>
        </div>
      </header>

      {/* Área de mensagens */}
      <section className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          // Tela inicial exatamente como ChatGPT
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-semibold mb-6 text-gray-900 dark:text-white">
                Como posso ajudar você hoje?
              </h1>
              <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Faça uma pergunta ou descreva o que você gostaria de saber
              </p>
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