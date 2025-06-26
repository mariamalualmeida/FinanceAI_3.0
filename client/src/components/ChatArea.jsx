import { useState, useEffect, useRef } from 'react'
import { Menu } from 'lucide-react'
import MessageBubble from './MessageBubble'
import InputArea from './InputArea'
import ThemeToggle from './ThemeToggle'

export default function ChatArea({ user, settings, interface: interfaceType, onToggleSidebar }) {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(null)
  const messagesEndRef = useRef(null)

  // Auto scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  // Função para enviar mensagem
  const sendMessage = async (text, files = []) => {
    if (!text.trim() && files.length === 0) return

    // Adicionar mensagem do usuário
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text, // Preservar quebras de linha
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsTyping(true)

    try {
      // Upload de arquivos se houver
      if (files.length > 0) {
        setUploadProgress(0)
        const formData = new FormData()
        files.forEach(file => formData.append('files', file))
        if (text.trim()) formData.append('message', text)

        // Fazer upload real e análise
        const uploadPromise = fetch('/api/upload', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })

        // Simular progresso enquanto processa
        const progressTimer = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressTimer)
              return 90
            }
            return prev + 15
          })
        }, 500)

        try {
          const response = await uploadPromise
          const result = await response.json()
          
          clearInterval(progressInterval)
          setUploadProgress(100)
          
          setTimeout(() => {
            setUploadProgress(null)
            
            if (result.success && result.analysis) {
              const analysis = result.analysis
              const userName = settings.userName ? `, ${settings.userName}` : ''
              const aiMessage = {
                id: Date.now() + 1,
                sender: 'assistant',
                text: `**Análise Financeira Completa${userName}**

📊 **Score de Crédito:** ${analysis.creditScore}/1000
⚠️ **Nível de Risco:** ${analysis.riskLevel === 'low' ? '🟢 Baixo' : analysis.riskLevel === 'medium' ? '🟡 Médio' : '🔴 Alto'}

💰 **Resumo Financeiro:**
• Receitas Totais: R$ ${analysis.totalIncome?.toLocaleString('pt-BR') || '0,00'}
• Gastos Totais: R$ ${analysis.totalExpenses?.toLocaleString('pt-BR') || '0,00'}
• Saldo: R$ ${analysis.balance?.toLocaleString('pt-BR') || '0,00'}
• Transações Analisadas: ${analysis.transactionCount || 0}

🔍 **Padrões Identificados:**
${analysis.patterns?.gambling ? '• ⚠️ Atividades de apostas detectadas' : '• ✅ Sem atividades de apostas'}
${analysis.patterns?.highRisk ? '• ⚠️ Comportamento de alto risco' : '• ✅ Comportamento financeiro estável'}
• Fluxo de Caixa: ${analysis.patterns?.cashFlow === 'positive' ? '🟢 Positivo' : analysis.patterns?.cashFlow === 'negative' ? '🔴 Negativo' : '🟡 Estável'}

📋 **Recomendações:**
${Array.isArray(analysis.recommendations) ? analysis.recommendations.map(rec => `• ${rec}`).join('\n') : '• Análise detalhada disponível'}

${analysis.summary || 'Análise completa realizada com sucesso.'}`,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, aiMessage])
            } else {
              // Análise falhou
              const aiMessage = {
                id: Date.now() + 1,
                sender: 'assistant',
                text: `❌ **Erro na Análise**

Houve um problema ao processar seus arquivos. Possíveis causas:
• Formato de arquivo não suportado
• Arquivo corrompido ou ilegível
• Conteúdo não reconhecido como documento financeiro

📋 **Formatos Suportados:**
• PDF (extratos, faturas, contracheques)
• Excel/CSV (planilhas financeiras)
• Imagens (JPG, PNG) com texto legível

Tente novamente com um arquivo diferente ou entre em contato para suporte.`,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, aiMessage])
            }
            setIsTyping(false)
          }, 800)
        } catch (error) {
          clearInterval(progressInterval)
          setUploadProgress(null)
          setIsTyping(false)
          
          const aiMessage = {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `❌ **Erro de Conexão**

Não foi possível processar o arquivo devido a um erro de rede. Verifique sua conexão e tente novamente.

Se o problema persistir, entre em contato com o suporte técnico.`,
            timestamp: new Date()
          }
          setMessages(prev => [...prev, aiMessage])
        }
      } else {
        // Resposta apenas texto
        setTimeout(() => {
          const userName = settings.userName ? `, ${settings.userName}` : ''
          let aiResponseText
          
          // Resposta mais inteligente baseada no conteúdo
          if (text.length > 200) {
            aiResponseText = `**Análise Detalhada Recebida${userName}**

Analisei seu documento/formulário detalhado. Com base nas informações fornecidas, posso oferecer:

• 📊 **Análise de extratos bancários** - Padrões de entrada e saída
• 💳 **Avaliação de score de crédito** - Baseada em histórico financeiro  
• 🔍 **Detecção de padrões de risco** - Identificação de comportamentos suspeitos
• 📈 **Consultoria em investimentos** - Recomendações personalizadas
• ⚠️ **Análise de riscos** - Avaliação de inadimplência

Para uma análise completa com IA, envie seus documentos financeiros (PDF, Excel, CSV) ou faça perguntas específicas sobre o conteúdo enviado.`
          } else {
            aiResponseText = `**Análise Preliminar${userName}**

Sou um assistente especializado em análise financeira e consultoria de crédito. Posso ajudar com:

• 📊 **Análise de extratos bancários**
• 💳 **Avaliação de score de crédito** 
• 🔍 **Detecção de padrões suspeitos**
• 📈 **Consultoria em investimentos**
• ⚠️ **Análise de riscos**

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

  return (
    <main className="flex flex-col flex-1 min-w-0 bg-white dark:bg-[#343541]">
      {/* Header estilo ChatGPT */}
      <header className="relative z-10 flex items-center justify-between p-4 border-b border-white/20 bg-white dark:bg-[#343541]">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg transition-colors text-gray-900 dark:text-white"
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
          <ThemeToggle theme={settings?.theme || 'light'} onToggle={settings?.onToggleTheme} />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
          Chat
        </h1>
        <div className="w-20" /> {/* Espaçador para centralizar o título */}
      </header>

      {/* Área de mensagens */}
      <section className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-gray-50/30 dark:from-[#343541] dark:to-[#343541]/80">
        {messages.length === 0 ? (
          // Tela inicial exatamente como ChatGPT
          <div className="flex flex-col items-center justify-center h-full px-6 text-center">
            <div className="max-w-2xl">
              <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-gray-900 dark:text-white">
                Por onde começamos?
              </h1>
            </div>
          </div>
        ) : (
          // Lista de mensagens
          <div className="w-full">
            {messages.map((message) => (
              <MessageBubble 
                key={message.id} 
                message={message}
              />
            ))}
            
            {/* Progresso de upload */}
            {uploadProgress !== null && (
              <div className="w-full border-b border-black/10 dark:border-gray-900/50 bg-gray-50 dark:bg-[#444654]">
                <div className="flex gap-4 px-4 py-6 max-w-3xl mx-auto">
                  <div className="flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center text-white text-sm font-bold bg-[#ab68ff]">
                    AI
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 dark:text-gray-100">
                      <p className="mb-2">Processando arquivos...</p>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{uploadProgress}% concluído</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Indicador de digitação */}
            {isTyping && uploadProgress === null && (
              <MessageBubble 
                message={{
                  id: 'typing',
                  sender: 'assistant',
                  text: 'Analisando...',
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
      <footer className="border-t border-white/20 p-4">
        <InputArea onSend={sendMessage} />
      </footer>
    </main>
  )
}