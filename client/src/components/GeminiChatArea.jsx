import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Mic, Square } from 'lucide-react'
import MessageBubble from './MessageBubble'

export default function GeminiChatArea({ user, settings, onToggleSidebar }) {
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0) return

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    try {
      if (files.length > 0) {
        setUploadProgress(0)
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        if (text.trim()) formData.append('message', text)

        const uploadPromise = fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        const progressTimer = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressTimer)
              return prev
            }
            return prev + Math.random() * 15
          })
        }, 200)

        try {
          const response = await uploadPromise
          const result = await response.json()
          clearInterval(progressTimer)
          setUploadProgress(100)
          
          setTimeout(() => {
            setUploadProgress(null)
            
            if (result.success && result.analysis) {
              const analysis = result.analysis
              const userName = settings.userName ? `, ${settings.userName}` : ''
              const aiMessage = {
                id: Date.now() + 1,
                sender: 'assistant',
                text: `# Análise Financeira Completa${userName}

## 📊 Score de Crédito: ${analysis.creditScore}/1000
**Nível de Risco:** ${analysis.riskLevel === 'low' ? '🟢 Baixo' : analysis.riskLevel === 'medium' ? '🟡 Médio' : '🔴 Alto'}

## 💰 Resumo Financeiro
- **Receitas Totais:** R$ ${analysis.totalIncome?.toLocaleString('pt-BR') || '0,00'}
- **Gastos Totais:** R$ ${analysis.totalExpenses?.toLocaleString('pt-BR') || '0,00'}
- **Saldo:** R$ ${analysis.balance?.toLocaleString('pt-BR') || '0,00'}
- **Transações Analisadas:** ${analysis.transactionCount || 0}

## 🔍 Padrões Identificados
${analysis.patterns?.gambling ? '- ⚠️ Atividades de apostas detectadas' : '- ✅ Sem atividades de apostas'}
${analysis.patterns?.highRisk ? '- ⚠️ Comportamento de alto risco' : '- ✅ Comportamento financeiro estável'}
- **Fluxo de Caixa:** ${analysis.patterns?.cashFlow === 'positive' ? '🟢 Positivo' : analysis.patterns?.cashFlow === 'negative' ? '🔴 Negativo' : '🟡 Estável'}

## 📋 Recomendações
${Array.isArray(analysis.recommendations) ? analysis.recommendations.map(rec => `- ${rec}`).join('\n') : '- Análise detalhada disponível'}

${analysis.summary || 'Análise completa realizada com sucesso.'}`,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, aiMessage])
            } else {
              const aiMessage = {
                id: Date.now() + 1,
                sender: 'assistant',
                text: `# ❌ Erro na Análise

Houve um problema ao processar seus arquivos. Possíveis causas:
- Formato de arquivo não suportado
- Arquivo corrompido ou ilegível
- Conteúdo não reconhecido como documento financeiro

## 📋 Formatos Suportados
- PDF (extratos, faturas, contracheques)
- Excel/CSV (planilhas financeiras)
- Imagens (JPG, PNG) com texto legível

Tente novamente com um arquivo diferente ou entre em contato para suporte.`,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, aiMessage])
            }
            setIsTyping(false)
          }, 1000)
        } catch (uploadError) {
          console.error('Erro no upload:', uploadError)
          setUploadProgress(null)
          setIsTyping(false)
        }
      } else {
        setTimeout(() => {
          const userName = settings.userName ? `, ${settings.userName}` : ''
          let aiResponseText
          
          if (text.length > 200) {
            aiResponseText = `# Análise Detalhada Recebida${userName}

Analisei seu documento/formulário detalhado. Com base nas informações fornecidas, posso oferecer:

- 📊 **Análise de extratos bancários** - Padrões de entrada e saída
- 💳 **Avaliação de score de crédito** - Baseada em histórico financeiro  
- 🔍 **Detecção de padrões de risco** - Identificação de comportamentos suspeitos
- 📈 **Consultoria em investimentos** - Recomendações personalizadas
- ⚠️ **Análise de riscos** - Avaliação de inadimplência

Para uma análise completa com IA, envie seus documentos financeiros (PDF, Excel, CSV) ou faça perguntas específicas sobre o conteúdo enviado.`
          } else {
            aiResponseText = `# Análise Preliminar${userName}

Sou um assistente especializado em análise financeira e consultoria de crédito. Posso ajudar com:

- 📊 **Análise de extratos bancários**
- 💳 **Avaliação de score de crédito** 
- 🔍 **Detecção de padrões suspeitos**
- 📈 **Consultoria em investimentos**
- ⚠️ **Análise de riscos**

Para uma análise mais detalhada, envie seus documentos financeiros (PDF, Excel, CSV).`
          }
          
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: aiResponseText,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
          setIsTyping(false)
        }, 1000 + Math.random() * 2000)
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error)
      setIsTyping(false)
      setUploadProgress(null)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const files = fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : []
    if (inputText.trim() || files.length > 0) {
      sendMessage(inputText, files)
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

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Gemini Header */}
      <header className="flex items-center justify-center py-4 px-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <h1 className="text-lg font-medium text-gray-900 dark:text-white">Gemini FinanceAI</h1>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold text-xl">G</span>
              </div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                Olá{settings.userName ? `, ${settings.userName}` : ''}!
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Sou seu assistente de análise financeira. Como posso ajudar hoje?
              </p>
            </div>
          )}
          
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} isGemini={true} />
          ))}
          
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">G</span>
              </div>
              <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}

          {uploadProgress !== null && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Analisando documentos...
                </span>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <div className="w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Olá${settings.userName ? `, ${settings.userName}` : ''}! Faça uma pergunta ou envie documentos financeiros para análise...`}
                  className="w-full min-h-[52px] max-h-32 px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.csv,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <Paperclip size={18} />
                </button>
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() && !fileInputRef.current?.files?.length}
                className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}