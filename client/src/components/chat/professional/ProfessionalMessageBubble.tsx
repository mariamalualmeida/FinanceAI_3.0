import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { Message } from "@shared/schema";

interface ProfessionalMessageBubbleProps {
  message: Message;
}

export default function ProfessionalMessageBubble({ message }: ProfessionalMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start max-w-4xl ${
        isUser ? "justify-end ml-auto" : "justify-start mr-auto"
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
          <Bot className="h-4 w-4 text-blue-400" />
        </div>
      )}
      
      <div
        className={`px-4 py-3 rounded-2xl max-w-2xl ${
          isUser
            ? "text-white rounded-br-sm"
            : "bg-gray-600 text-gray-100 rounded-bl-sm"
        }`}
        style={{
          backgroundColor: isUser ? '#004D40' : '#3C4043'
        }}
      >
        <div className="text-sm font-medium mb-1 opacity-80">
          {isUser ? "Você" : "FinanceAI"}
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="text-xs opacity-60 mt-2">
          {message.createdAt ? new Date(message.createdAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
          }) : "Agora"}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center ml-3 flex-shrink-0" style={{ backgroundColor: '#004D40' }}>
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </motion.div>
  );
}