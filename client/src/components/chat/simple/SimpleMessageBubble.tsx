import { motion } from "framer-motion";
import type { Message } from "@shared/schema";

interface SimpleMessageBubbleProps {
  message: Message;
}

export default function SimpleMessageBubble({ message }: SimpleMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`max-w-2xl px-4 py-3 rounded-2xl whitespace-pre-wrap ${
        isUser 
          ? "bg-green-600 text-white ml-auto" 
          : "bg-gray-300 dark:bg-gray-700 mr-auto"
      }`}
    >
      <div className="text-sm">{message.content}</div>
      <div className="text-xs opacity-70 mt-2">
        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        }) : "Agora"}
      </div>
    </motion.div>
  );
}