import { useState, useEffect, useRef } from 'react'
import { Menu, Sun, Moon } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'

export default function ChatArea({ darkMode, toggleSidebar }) {
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'assistant', 
      text: 'Olá! Sou seu assistente de IA. Como posso ajudá-lo hoje?',
      timestamp: new Date()
    }
  ])
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
    }, 1000 + Math.random() * 2000) // Delay realista
  }

  return (
    <main className="flex flex-col flex-1 min-w-0">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541]">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ChatGPT
          </h1>
        </div>
      </header>

      {/* Área de mensagens */}
      <section className="flex-1 overflow-y-auto">
        {messages.length === 1 ? (
          // Tela inicial
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="max-w-md">
              <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                Como posso ajudar você hoje?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Faça uma pergunta ou descreva o que você gostaria de saber
              </p>
            </div>
          </div>
        ) : (
          // Lista de mensagens
          <div className="max-w-3xl mx-auto p-4 space-y-6">
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
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-[#343541]">
        <InputArea onSend={sendMessage} />
      </footer>
    </main>
  )
}