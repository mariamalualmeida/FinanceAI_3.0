import { useState } from 'react'
import { SendHorizonal, Paperclip } from 'lucide-react'

export default function InputArea({ onSend }) {
  const [text, setText] = useState('')
  const handleSend = () => { if (!text.trim()) return; onSend(text); setText('') }
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }

  return (
    <div className="flex items-center gap-2">
      <button className="p-2 text-gray-600 dark:text-gray-300 hover:text-green-500"><Paperclip size={20}/></button>
      <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} rows={1} className="flex-1 p-2 bg-gray-100 dark:bg-gray-700 rounded-md resize-none outline-none" placeholder="Digite sua mensagem..."/>
      <button onClick={handleSend} className="p-2 text-green-600 hover:text-green-800"><SendHorizonal size={20}/></button>
    </div>
  )
}
