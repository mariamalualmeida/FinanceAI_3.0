import { motion } from 'framer-motion'

export default function MessageBubble({ sender, children }) {
  const isUser = sender === 'user'
  return (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-3 rounded-xl max-w-[70%] ${isUser ? 'bg-green-600 text-white ml-auto' : 'bg-gray-200 dark:bg-gray-700'}`}>{children}</motion.div>)
}
