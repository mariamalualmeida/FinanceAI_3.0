import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, Paperclip, Menu, Settings, User, MoreHorizontal, 
  Download, Share, Copy, RefreshCw, Mic, MicOff, 
  FileText, Image, Video, Music, Archive, 
  AlertCircle, CheckCircle, Clock, Brain
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import ThemeToggle from './ThemeToggle';

const EnhancedChatArea = ({ user, settings, onToggleSidebar, interface: interfaceType = 'chatgpt' }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [messageStats, setMessageStats] = useState({ total: 0, today: 0 });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [analysisStatus, setAnalysisStatus] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);

  // Auto scroll para a última mensagem
  useEffect(() => {
    if (settings?.interface?.auto_scroll !== false) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputText]);

  // Load conversation messages
  useEffect(() => {
    loadMessages();
    updateMessageStats();
  }, []);

  const loadMessages = async () => {
    try {
      const response = await fetch('/api/conversations/1/messages', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const updateMessageStats = () => {
    const today = new Date().toDateString();
    const todayMessages = messages.filter(msg => 
      new Date(msg.createdAt).toDateString() === today
    ).length;
    setMessageStats({ total: messages.length, today: todayMessages });
  };

  // Enhanced send message with AI analysis
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      content: text,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setSelectedFiles([]);
    setIsTyping(true);
    setAnalysisStatus('processing');

    try {
      let apiUrl = '/api/conversations/1/messages';
      let requestData = { content: text };

      if (files.length > 0) {
        setUploadProgress(0);
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (text.trim()) formData.append('message', text);

        // Progress simulation
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 20;
          });
        }, 200);

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          requestData.fileAnalysis = uploadData.analysis;
          setAnalysisStatus('analyzing');
        }

        setTimeout(() => setUploadProgress(null), 1000);
      }

      // Send message to AI
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Enhanced AI response with analysis
        const aiMessage = {
          id: Date.now() + 1,
          sender: 'assistant',
          content: data.aiMessage?.content || generateEnhancedResponse(text, files),
          analysis: data.analysis,
          recommendations: data.recommendations,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        setAnalysisStatus('complete');
        
        // Auto save if enabled
        if (settings?.ai?.auto_save) {
          await saveConversation();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setAnalysisStatus('error');
      
      // Fallback error message
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        error: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => setAnalysisStatus(null), 3000);
    }
  };

  const generateEnhancedResponse = (text, files) => {
    const hasFiles = files.length > 0;
    const hasFinancialKeywords = /extrato|fatura|cartão|crédito|débito|pix|transferência|investimento|score/.test(text.toLowerCase());
    
    let response = `Analisei sua mensagem: "${text}"`;
    
    if (hasFiles) {
      response += `\n\n📄 **Documentos recebidos:** ${files.length} arquivo(s)`;
      files.forEach(file => {
        response += `\n• ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`;
      });
    }
    
    if (hasFinancialKeywords) {
      response += `\n\n💰 **Análise Financeira Detectada**\nIdentifiquei termos relacionados a:\n• Análise de extratos bancários\n• Avaliação de score de crédito\n• Detecção de padrões de gastos\n• Consultoria em investimentos`;
    }
    
    response += `\n\n🤖 **Como posso ajudar:**\n• Análise detalhada de documentos financeiros\n• Cálculo de score de crédito\n• Identificação de riscos e oportunidades\n• Recomendações personalizadas\n• Relatórios completos\n\nEnvie seus documentos financeiros para uma análise mais detalhada!`;
    
    return response;
  };

  const saveConversation = async () => {
    try {
      await fetch('/api/conversations/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          title: `Conversa ${new Date().toLocaleDateString()}`,
          updatedAt: new Date()
        })
      });
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  };

  // Voice recording functionality
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      const audioChunks = [];
      mediaRecorderRef.current.ondataavailable = event => {
        audioChunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });
        setSelectedFiles([audioFile]);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Enhanced file handling
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Quick actions
  const quickActions = [
    { label: 'Análise de Extrato', action: () => setInputText('Analise meu extrato bancário') },
    { label: 'Score de Crédito', action: () => setInputText('Calcule meu score de crédito') },
    { label: 'Relatório Financeiro', action: () => setInputText('Gere um relatório financeiro completo') },
    { label: 'Investimentos', action: () => setInputText('Recomende investimentos baseados no meu perfil') }
  ];

  // Enhanced keyboard handling
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        return; // Allow new line
      }
      e.preventDefault();
      sendMessage(inputText, selectedFiles);
    }
  };

  // Message actions
  const copyMessage = (content) => {
    navigator.clipboard.writeText(content);
  };

  const downloadMessage = (content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mensagem-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) return <Image size={16} className="text-blue-500" />;
    if (fileType.startsWith('video/')) return <Video size={16} className="text-purple-500" />;
    if (fileType.startsWith('audio/')) return <Music size={16} className="text-green-500" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const getAnalysisStatusIcon = () => {
    switch (analysisStatus) {
      case 'processing': return <Clock className="animate-spin text-blue-500" size={16} />;
      case 'analyzing': return <Brain className="animate-pulse text-purple-500" size={16} />;
      case 'complete': return <CheckCircle className="text-green-500" size={16} />;
      case 'error': return <AlertCircle className="text-red-500" size={16} />;
      default: return null;
    }
  };

  const isGeminiStyle = interfaceType === 'gemini';

  return (
    <main className={`flex-1 flex flex-col ${isGeminiStyle ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-900'}`}>
      {/* Enhanced Header */}
      <header className={`flex items-center justify-between py-3 px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 ${isGeminiStyle ? 'bg-white dark:bg-gray-900' : 'bg-white dark:bg-gray-800'}`}>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            {isGeminiStyle ? (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400">
                  <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                </svg>
                <span className="text-lg font-normal text-gray-800 dark:text-gray-200">Mig</span>
              </>
            ) : (
              <>
                <svg width="24" height="24" viewBox="0 0 24 24" className="text-green-600 dark:text-green-400">
                  <path fill="currentColor" d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-.74L12 2z"/>
                </svg>
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">FinanceAI</span>
              </>
            )}
            
            {analysisStatus && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                {getAnalysisStatusIcon()}
                <span>
                  {analysisStatus === 'processing' && 'Processando...'}
                  {analysisStatus === 'analyzing' && 'Analisando documentos...'}
                  {analysisStatus === 'complete' && 'Análise completa'}
                  {analysisStatus === 'error' && 'Erro na análise'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Message stats */}
          <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
            {messageStats.today} hoje • {messageStats.total} total
          </div>
          
          <ThemeToggle 
            theme={settings?.theme || 'light'} 
            onToggle={settings?.onToggleTheme} 
          />
          
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Quick Actions Panel */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ações Rápidas</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      setShowQuickActions(false);
                    }}
                    className="p-2 text-sm text-left hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            {/* Welcome Screen */}
            <div className="text-center max-w-2xl">
              <div className="mb-8">
                {isGeminiStyle ? (
                  <svg width="64" height="64" viewBox="0 0 24 24" className="text-blue-600 dark:text-blue-400 mx-auto">
                    <path fill="currentColor" d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z"/>
                  </svg>
                ) : (
                  <svg width="64" height="64" viewBox="0 0 24 24" className="text-green-600 dark:text-green-400 mx-auto">
                    <path fill="currentColor" d="M12 2l3.09 6.26L22 9l-5 4.87L18.18 21 12 17.77 5.82 21 7 13.87 2 9l6.91-.74L12 2z"/>
                  </svg>
                )}
              </div>
              
              <h1 className={`text-4xl font-${isGeminiStyle ? 'light' : 'bold'} text-gray-900 dark:text-white mb-4`}>
                {settings?.userName ? `Olá, ${settings.userName}` : 'Olá'}
              </h1>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                {isGeminiStyle 
                  ? 'Como posso ajudá-lo hoje?' 
                  : 'Seu assistente especializado em análise financeira e consultoria de crédito'
                }
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📊 Análise Inteligente</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Upload de extratos, faturas e documentos para análise automática
                  </p>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 Score Personalizado</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Cálculo de score de crédito e recomendações personalizadas
                  </p>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">🔍 Detecção de Riscos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Identificação automática de padrões suspeitos e apostas
                  </p>
                </div>
                
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">📈 Relatórios Completos</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Relatórios detalhados com insights e recomendações
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-4 space-y-4">
            {messages.map((message, index) => (
              <div key={message.id || index} className="group relative">
                <MessageBubble 
                  message={message}
                  isUser={message.sender === 'user'}
                  showTimestamp={true}
                />
                
                {/* Message actions */}
                {message.sender === 'assistant' && (
                  <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyMessage(message.content)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Copiar mensagem"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => downloadMessage(message.content)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      title="Baixar mensagem"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 px-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm">Analisando...</span>
              </div>
            )}

            {/* Upload progress */}
            {uploadProgress !== null && (
              <div className="px-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Upload: {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2">
                  {getFileIcon(file.type)}
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            {/* Voice recording button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-3 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full transition-colors"
            >
              <Paperclip size={20} />
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.xlsx,.xls,.csv,.txt,.png,.jpg,.jpeg,.mp3,.wav,.mp4"
            />

            {/* Enhanced text input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem... (Shift+Enter para nova linha)"
                className={`w-full p-4 border border-gray-300 dark:border-gray-600 rounded-2xl resize-none min-h-[52px] max-h-32 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-500 dark:placeholder-gray-400
                  ${isGeminiStyle ? 'text-sm' : 'text-base'}
                  transition-all duration-200`}
                rows={1}
              />
              
              {/* Character count */}
              {inputText.length > 0 && (
                <div className="absolute bottom-1 right-1 text-xs text-gray-400">
                  {inputText.length}/4000
                </div>
              )}
            </div>

            {/* Enhanced send button */}
            <button
              onClick={() => sendMessage(inputText, selectedFiles)}
              disabled={!inputText.trim() && selectedFiles.length === 0}
              className={`p-3 rounded-full transition-all duration-200 ${
                inputText.trim() || selectedFiles.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={20} />
            </button>
          </div>

          {/* Input hints */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
            Envie documentos financeiros para análise automática • 
            Use Shift+Enter para nova linha • 
            Máximo 10MB por arquivo
          </div>
        </div>
      </div>
    </main>
  );
};

export default EnhancedChatArea;