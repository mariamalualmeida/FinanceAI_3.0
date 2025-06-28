import { useState, useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'
import ReactMarkdown from 'react-markdown'

export default function ChatArea() {
  const [messages, setMessages] = useState([{ sender: 'ia', text: 'Olá! Sou sua assistente. Como posso ajudar hoje?' }])
  const scrollRef = useRef(null)
  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])
  const sendMessage = (text) => { setMessages(prev => [...prev, { sender: 'user', text }]); setTimeout(() => { setMessages(prev => [...prev, { sender: 'ia', text: 'Recebi sua mensagem!' }]) }, 1000) }

  return (
    <main className="flex flex-col flex-1">
      <header className="p-4 border-b border-gray-300 dark:border-gray-700"><h1 className="text-lg font-semibold">ChatGPT Clone</h1></header>
      <section className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((msg, i) => (<MessageBubble key={i} sender={msg.sender}><ReactMarkdown>{msg.text}</ReactMarkdown></MessageBubble>))}<div ref={scrollRef}></div></section>
      <footer className="p-4 border-t border-gray-300 dark:border-gray-700"><InputArea onSend={sendMessage}/></footer>
    </main>
  )
}
