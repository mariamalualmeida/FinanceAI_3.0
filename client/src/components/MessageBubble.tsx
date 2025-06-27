import { useState } from 'react'
import { FileText, Image, File, Edit2, Check, X } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface Message {
  id: number
  sender: 'user' | 'ai'
  text: string
  files?: Array<{ name: string; size: number; type: string }>
  timestamp: Date
}

interface MessageBubbleProps {
  message: Message
  isGemini: boolean
  onEdit?: (messageId: number, newText: string) => void
}

export default function MessageBubble({ message, isGemini, onEdit }: MessageBubbleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(message.id, editText)
    }
    setIsEditing(false)
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image size={16} className="text-blue-500" />
    } else if (['pdf'].includes(ext || '')) {
      return <FileText size={16} className="text-red-500" />
    } else {
      return <File size={16} className="text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={`message-bubble ${message.sender === 'user' ? 'message-user' : 'message-ai'}`}>
      <div className="flex items-start gap-3">
        {message.sender === 'ai' && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
          </div>
        )}
        
        <div className="flex-1">
          {/* Arquivos anexados */}
          {message.files && message.files.length > 0 && (
            <div className="mb-2 space-y-1">
              {message.files.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm">
                  {getFileIcon(file.name)}
                  <span className="font-medium text-gray-900 dark:text-gray-100">{file.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">({formatFileSize(file.size)})</span>
                </div>
              ))}
            </div>
          )}

          {/* Conteúdo da mensagem */}
          <div className="message-content">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                  >
                    <Check size={14} />
                    Salvar
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="group relative">
                {message.sender === 'ai' ? (
                  <ReactMarkdown 
                    className="prose prose-sm max-w-none dark:prose-invert"
                    components={{
                      code: ({ children, ...props }) => (
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      )
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{message.text}</p>
                )}
                
                {/* Botão de edição para mensagens do usuário */}
                {message.sender === 'user' && onEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white dark:bg-gray-800 rounded-full shadow-lg"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Timestamp */}
          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {message.timestamp.toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {message.sender === 'user' && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">U</span>
          </div>
        )}
      </div>
    </div>
  )
}