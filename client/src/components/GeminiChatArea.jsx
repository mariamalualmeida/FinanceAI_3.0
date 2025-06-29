import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Menu, Upload, FileText, X, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import ThemeToggle from './ThemeToggle'
import AudioRecorder from './AudioRecorder'
import InputAreaFixed from './InputAreaFixed'
import { useFileUpload } from '../hooks/useFileUpload'

export default function GeminiChatArea({ user, settings, onToggleSidebar, sidebarOpen, currentConversation, onConversationUpdate, onUpdateConversationTitle }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [audioData, setAudioData] = useState(null)
  const [currentConversationId, setCurrentConversationId] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadingFiles, setUploadingFiles] = useState([])
  const [showUploadProgress, setShowUploadProgress] = useState(false)
  const [uploadStatus, setUploadStatus] = useState({})
  
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const { uploadFiles, uploadProgress, isUploading } = useFileUpload()

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Carregar mensagens quando conversa muda
  useEffect(() => {
    if (currentConversation?.id) {
      setCurrentConversationId(currentConversation.id)
      loadConversationMessages(currentConversation.id)
    } else {
      // Nova conversa - limpar chat
      setMessages([])
      setCurrentConversationId(null)
    }
  }, [currentConversation])

  // Função para carregar mensagens da conversa
  const loadConversationMessages = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        credentials: 'include'
      })
      if (response.ok) {
        const messages = await response.json()
        setMessages(messages.map(msg => ({
          id: msg.id,
          sender: msg.sender,
          text: msg.content,
          timestamp: new Date(msg.createdAt)
        })))
      }
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  // Função para enviar mensagem
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0 && !audioData) return

    const finalText = text || (audioData?.transcription ? audioData.transcription : '')
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: finalText,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setAudioData(null)
    setIsTyping(true)

    try {
      if (files.length > 0) {
        const { success, result } = await uploadFiles(files, finalText)
        
        if (success && result.analysis) {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.analysis || 'Arquivo processado com sucesso!',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        // Enviar mensagem para a IA
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message: finalText,
            conversationId: currentConversationId
          })
        });

        if (response.ok) {
          const result = await response.json();
          
          // Atualizar conversationId se nova conversa foi criada
          if (result.conversationId && !currentConversationId) {
            setCurrentConversationId(result.conversationId)
            onConversationUpdate?.(result.conversationId)
            
            // Implementar nome inteligente: usar primeiras 4-6 palavras da mensagem
            if (text.trim() && onUpdateConversationTitle) {
              const words = text.trim().split(' ').slice(0, 6).join(' ')
              const smartTitle = words.length > 40 ? words.substring(0, 40) + '...' : words
              onUpdateConversationTitle(result.conversationId, smartTitle)
            }
          }
          
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: result.response || 'Desculpe, não consegui processar sua mensagem.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        } else {
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
        setIsTyping(false)
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      setIsTyping(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []
    if (inputText.trim() || files.length > 0 || audioData) {
      sendMessage(inputText, files)
      
      // Limpar campos
      setInputText('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0 && !inputText.trim()) {
      sendMessage('', files)
      e.target.value = ''
    }
  }

  const handleAudioReady = (audio) => {
    setAudioData(audio)
    if (audio?.transcription) {
      setInputText(audio.transcription)
    }
  }

  // Funções de drag & drop e upload de documentos financeiros
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFinancialDocumentUpload(files);
    }
  };

  // Função para upload de documentos financeiros
  const handleFinancialDocumentUpload = async (files) => {
    if (!currentConversationId) {
      alert('Por favor, inicie uma conversa antes de enviar arquivos.');
      return;
    }

    setShowUploadProgress(true);
    setUploadingFiles(files.map(file => ({ 
      name: file.name, 
      size: file.size, 
      status: 'uploading' 
    })));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', currentConversationId);

      try {
        // Atualizar mensagem do usuário
        setMessages(prev => [...prev, {
          id: Date.now(),
          content: `📎 Enviando documento: ${file.name}`,
          sender: 'user',
          timestamp: new Date()
        }]);

        const response = await fetch('/api/upload-financial-document', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          // Atualizar status do arquivo
          setUploadingFiles(prev => prev.map((f, idx) => 
            idx === i ? { ...f, status: 'processing' } : f
          ));

          // Adicionar mensagem de confirmação
          setMessages(prev => [...prev, {
            id: Date.now() + 1,
            content: `✅ ${result.message}`,
            sender: 'assistant',
            timestamp: new Date()
          }]);

          // Recarregar mensagens após processamento
          setTimeout(() => {
            loadConversationMessages(currentConversationId);
          }, 3000);

        } else {
          throw new Error(result.error || 'Erro no upload');
        }
      } catch (error) {
        console.error('Erro no upload:', error);
        
        // Atualizar status do arquivo
        setUploadingFiles(prev => prev.map((f, idx) => 
          idx === i ? { ...f, status: 'error' } : f
        ));

        // Adicionar mensagem de erro
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          content: `❌ Erro ao enviar ${file.name}: ${error.message}`,
          sender: 'assistant',
          timestamp: new Date()
        }]);
      }
    }

    // Limpar progress após 5 segundos
    setTimeout(() => {
      setShowUploadProgress(false);
      setUploadingFiles([]);
    }, 5000);
  };

  // Função para abrir seletor de arquivos
  const openFinancialFileSelector = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.xlsx,.xls,.csv,.txt';
    input.multiple = true;
    input.onchange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        handleFinancialDocumentUpload(files);
      }
    };
    input.click();
  };

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-gray-900 h-screen overflow-hidden gemini-chat-container">
      {/* Gemini Header - Fundo uniforme */}
      <header className="flex items-center justify-between py-2 px-4 bg-white dark:bg-gray-900 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          {!sidebarOpen && (
            <>
              <button
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>
              <ThemeToggle theme={settings?.theme || 'light'} onToggle={settings?.onToggleTheme} />
            </>
          )}
          <div className="flex items-center gap-2 ml-2">
            <svg width="24" height="24" viewBox="0 0 24 24" className="text-gray-600 dark:text-gray-400">
              <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
            </svg>
            <span className="text-lg font-normal text-gray-800 dark:text-gray-200">Mig</span>
          </div>
        </div>
        <div className="w-20" />
      </header>

      {/* Área de conteúdo principal - Fundo uniforme */}
      <div 
        className="flex-1 overflow-y-auto relative" 
        style={{ paddingBottom: '200px' }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            {/* Logo central */}
            <div className="mb-8">
              <svg width="64" height="64" viewBox="0 0 24 24" className="text-gray-600 dark:text-gray-400">
                <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
              </svg>
            </div>
            
            {/* Saudação minimalista */}
            <div className="text-center">
              <h1 className="text-4xl font-light text-gray-900 dark:text-white mb-2">
                Olá
              </h1>
              {user && (
                <h2 className="text-2xl font-medium text-gray-700 dark:text-gray-300 mb-4">
                  {user.username}
                </h2>
              )}
              <p className="text-base text-gray-600 dark:text-gray-400">
                Como posso ajudá-lo hoje?
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-8 pb-48 messages-container">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} isGemini={true} />
            ))}
            
            {isTyping && (
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" className="text-white">
                    <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            {uploadProgress !== null && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-sm">↗</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-blue-800 dark:text-blue-200 font-medium">Enviando arquivo...</p>
                    <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border-2 border-dashed border-blue-500 max-w-md mx-4">
              <div className="text-center">
                <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Análise Financeira
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Solte aqui para analisar documentos financeiros (PDF, Excel, CSV)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress de Upload Melhorado */}
        {showUploadProgress && uploadingFiles.length > 0 && (
          <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 rounded-3xl shadow-lg border p-4 max-w-sm z-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Processando ({uploadingFiles.length})
              </h4>
              <button 
                onClick={() => setShowUploadProgress(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {uploadingFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <div className="flex-1">
                    <p className="text-gray-700 dark:text-gray-300 truncate">{file.name}</p>
                    <div className="flex items-center gap-2">
                      {file.status === 'uploading' && (
                        <>
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-blue-600 dark:text-blue-400">Enviando...</span>
                        </>
                      )}
                      {file.status === 'processing' && (
                        <>
                          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                          <span className="text-yellow-600 dark:text-yellow-400">Analisando...</span>
                        </>
                      )}
                      {file.status === 'error' && (
                        <>
                          <AlertCircle className="w-3 h-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Erro</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
        
        {/* Área de input corrigida */}
        <div className="fixed bottom-0 left-0 right-0 z-40">
          <InputAreaFixed 
            onSend={sendMessage}
            onFileUpload={(file) => {
              // Upload real de arquivos via clips
              handleFinancialDocumentUpload([file])
            }}
            onFinancialAnalysis={openFinancialFileSelector}
            isProcessing={isTyping}
            uploadProgress={uploadProgress ? { progress: uploadProgress, fileName: 'Processando...' } : null}
          />
        </div>
      </div>
    </main>
  )
}