import { useState, useEffect } from 'react'
import { 
  Settings, 
  Users, 
  Database, 
  Key, 
  FileText, 
  Upload,
  Trash2,
  Edit,
  Edit3,
  X,
  BookOpen,
  Plus,
  Eye,
  EyeOff,
  User,
  AlertCircle,
  Zap,
  MessageSquare,
  Network,
  Shield,
  Server,
  Cpu
} from 'lucide-react'

export default function AdminPanel({ onClose, user }) {
  const [activeTab, setActiveTab] = useState('llm')
  const [llmConfigs, setLlmConfigs] = useState([])
  const [systemPrompts, setSystemPrompts] = useState([])
  const [strategies, setStrategies] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acesso Negado</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Você precisa ter privilégios de administrador para acessar este painel.
            </p>
            <button
              onClick={onClose}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'llm', label: 'Configurações LLM', icon: Settings },
    { id: 'prompts', label: 'Prompts do Sistema', icon: FileText },
    { id: 'strategy', label: 'Estratégias Multi-LLM', icon: Database },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: BookOpen },
    { id: 'system', label: 'Sistema', icon: Key },
    { id: 'users', label: 'Usuários', icon: Users }
  ]

  // Load data functions
  const loadLlmConfigs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/llm-configs', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setLlmConfigs(data)
      }
    } catch (error) {
      console.error('Error loading LLM configs:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSystemPrompts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/system-prompts', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setSystemPrompts(data)
      }
    } catch (error) {
      console.error('Error loading system prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStrategies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/multi-llm-strategies', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setStrategies(data)
      }
    } catch (error) {
      console.error('Error loading strategies:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load data based on active tab
  useEffect(() => {
    switch (activeTab) {
      case 'llm':
        loadLlmConfigs()
        break
      case 'prompts':
        loadSystemPrompts()
        break
      case 'strategy':
        loadStrategies()
        break
      default:
        break
    }
  }, [activeTab])

  // Strategy Management Component
  const StrategyManagementSection = () => {
    const [strategies, setStrategies] = useState([
      {
        id: 1,
        name: 'Econômico',
        description: 'Usa principalmente modelos básicos, priorizando custo',
        primaryLLM: 'openai',
        backupLLM: 'google',
        validationLLM: null,
        isActive: true,
        costMultiplier: 0.5,
        subjects: ['general', 'simple_analysis']
      },
      {
        id: 2,
        name: 'Balanceado',
        description: 'Equilibra performance e custo',
        primaryLLM: 'anthropic',
        backupLLM: 'openai',
        validationLLM: 'google',
        isActive: true,
        costMultiplier: 1.0,
        subjects: ['financial', 'credit']
      },
      {
        id: 3,
        name: 'Premium',
        description: 'Máxima precisão com validação cruzada',
        primaryLLM: 'anthropic',
        backupLLM: 'openai',
        validationLLM: 'google',
        isActive: true,
        costMultiplier: 2.0,
        subjects: ['risk', 'complex_analysis']
      }
    ])
    const [editingStrategy, setEditingStrategy] = useState(null)
    const [showAddForm, setShowAddForm] = useState(false)
    
    const llmOptions = [
      { value: 'openai', label: 'OpenAI GPT-4o' },
      { value: 'anthropic', label: 'Anthropic Claude' },
      { value: 'google', label: 'Google Gemini' }
    ]

    const subjectOptions = [
      { value: 'general', label: 'Consultas Gerais' },
      { value: 'financial', label: 'Análise Financeira' },
      { value: 'credit', label: 'Análise de Crédito' },
      { value: 'risk', label: 'Detecção de Riscos' },
      { value: 'simple_analysis', label: 'Análises Simples' },
      { value: 'complex_analysis', label: 'Análises Complexas' }
    ]

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estratégias Multi-LLM</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 text-sm"
          >
            <Plus size={16} />
            Nova Estratégia
          </button>
        </div>

        <div className="space-y-3">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Network className="text-purple-600" size={18} />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      strategy.costMultiplier <= 0.7 
                        ? 'bg-green-100 text-green-800' 
                        : strategy.costMultiplier <= 1.3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {strategy.costMultiplier <= 0.7 ? 'Econômico' : strategy.costMultiplier <= 1.3 ? 'Moderado' : 'Premium'}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      strategy.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {strategy.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {strategy.description}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <div className="text-xs">
                      <span className="text-gray-500">Primário:</span> <span className="font-medium">{llmOptions.find(l => l.value === strategy.primaryLLM)?.label}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Backup:</span> <span className="font-medium">{llmOptions.find(l => l.value === strategy.backupLLM)?.label}</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-500">Validação:</span> <span className="font-medium">{strategy.validationLLM ? llmOptions.find(l => l.value === strategy.validationLLM)?.label : 'Nenhuma'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <span>Assuntos:</span> {strategy.subjects.map(s => subjectOptions.find(opt => opt.value === s)?.label).join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingStrategy(strategy)}
                    className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setStrategies(strategies.filter(s => s.id !== strategy.id))}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(showAddForm || editingStrategy) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h4 className="text-lg font-semibold mb-4">
                {editingStrategy ? 'Editar Estratégia' : 'Nova Estratégia'}
              </h4>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome da estratégia"
                  defaultValue={editingStrategy?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <textarea
                  placeholder="Descrição da estratégia"
                  defaultValue={editingStrategy?.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">LLM Primário</label>
                    <select
                      defaultValue={editingStrategy?.primaryLLM || 'openai'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {llmOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">LLM Backup</label>
                    <select
                      defaultValue={editingStrategy?.backupLLM || 'google'}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      {llmOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">LLM Validação</label>
                    <select
                      defaultValue={editingStrategy?.validationLLM || ''}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Nenhum</option>
                      {llmOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Multiplicador de Custo</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="5"
                    defaultValue={editingStrategy?.costMultiplier || 1.0}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Assuntos Aplicáveis</label>
                  <div className="grid grid-cols-2 gap-2">
                    {subjectOptions.map(subject => (
                      <label key={subject.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked={editingStrategy?.subjects?.includes(subject.value)}
                          className="rounded"
                        />
                        <span className="text-sm">{subject.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="strategyActive"
                    defaultChecked={editingStrategy?.isActive !== false}
                    className="rounded"
                  />
                  <label htmlFor="strategyActive" className="text-sm text-gray-700 dark:text-gray-300">
                    Estratégia ativa
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingStrategy(null)
                    setShowAddForm(false)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setEditingStrategy(null)
                    setShowAddForm(false)
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  {editingStrategy ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Prompts Management Component
  const PromptsManagementSection = () => {
    const [prompts, setPrompts] = useState([
      {
        id: 1,
        name: 'Análise Financeira Inicial',
        description: 'Prompt para análise inicial de documentos financeiros',
        content: 'Analise o documento financeiro fornecido e identifique...',
        category: 'financial',
        isActive: true,
        chain: 1
      },
      {
        id: 2,
        name: 'Detecção de Riscos',
        description: 'Identifica padrões de risco em transações',
        content: 'Examine as transações em busca de padrões suspeitos...',
        category: 'risk',
        isActive: true,
        chain: 2
      }
    ])
    const [editingPrompt, setEditingPrompt] = useState(null)
    const [showAddForm, setShowAddForm] = useState(false)
    
    const promptCategories = [
      { value: 'financial', label: 'Análise Financeira' },
      { value: 'risk', label: 'Detecção de Riscos' },
      { value: 'credit', label: 'Análise de Crédito' },
      { value: 'general', label: 'Geral' }
    ]

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Prompts do Sistema</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus size={16} />
            Novo Prompt
          </button>
        </div>

        <div className="space-y-3">
          {prompts.map((prompt) => (
            <div key={prompt.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="text-blue-600" size={18} />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{prompt.name}</h4>
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      Cadeia {prompt.chain}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      prompt.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {prompt.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {prompt.description}
                  </p>
                  <p className="text-xs text-gray-500 mb-2">
                    Categoria: {promptCategories.find(c => c.value === prompt.category)?.label}
                  </p>
                  <div className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded max-h-20 overflow-hidden">
                    {prompt.content.substring(0, 150)}...
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => setEditingPrompt(prompt)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => setPrompts(prompts.filter(p => p.id !== prompt.id))}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(showAddForm || editingPrompt) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h4 className="text-lg font-semibold mb-4">
                {editingPrompt ? 'Editar Prompt' : 'Novo Prompt'}
              </h4>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome do prompt"
                  defaultValue={editingPrompt?.name || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Descrição"
                  defaultValue={editingPrompt?.description || ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="grid grid-cols-2 gap-4">
                  <select
                    defaultValue={editingPrompt?.category || 'general'}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    {promptCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Posição na cadeia (1-12)"
                    min="1"
                    max="12"
                    defaultValue={editingPrompt?.chain || 1}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <textarea
                  placeholder="Conteúdo do prompt..."
                  defaultValue={editingPrompt?.content || ''}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    defaultChecked={editingPrompt?.isActive !== false}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                    Prompt ativo
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setEditingPrompt(null)
                    setShowAddForm(false)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setEditingPrompt(null)
                    setShowAddForm(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingPrompt ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Knowledge Base Component
  const KnowledgeBaseSection = () => {
    const [documents, setDocuments] = useState([
      { id: 1, name: 'Manual Financeiro.pdf', type: 'pdf', size: '2.3 MB', uploadDate: '2025-06-27', status: 'indexed' },
      { id: 2, name: 'Guia Análise Crédito.docx', type: 'docx', size: '1.8 MB', uploadDate: '2025-06-26', status: 'processing' }
    ])
    const [showUploadForm, setShowUploadForm] = useState(false)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Base de Conhecimento</h3>
          <button
            onClick={() => setShowUploadForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm"
          >
            <Upload size={16} />
            Upload Documento
          </button>
        </div>

        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="text-green-600" size={18} />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{doc.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      doc.status === 'indexed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {doc.status === 'indexed' ? 'Indexado' : 'Processando'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Tamanho: {doc.size} | Formato: {doc.type.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Enviado em: {doc.uploadDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => console.log('View document:', doc.id)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => console.log('Delete document:', doc.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold mb-4">Upload Documento</h4>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Arraste arquivos ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, TXT até 10MB
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Nome do documento (opcional)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // System Configuration Component
  const SystemConfigSection = () => {
    const [configs, setConfigs] = useState({
      maxFileSize: 10,
      allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'csv', 'xlsx'],
      maxConversations: 100,
      sessionTimeout: 24,
      analysisTimeout: 300,
      enableCache: true,
      enableNotifications: true,
      autoSaveInterval: 30,
      backupFrequency: 'daily',
      maintenanceMode: false
    })
    const [editingConfig, setEditingConfig] = useState(false)

    const fileTypeOptions = [
      { value: 'pdf', label: 'PDF' },
      { value: 'doc', label: 'DOC' },
      { value: 'docx', label: 'DOCX' },
      { value: 'txt', label: 'TXT' },
      { value: 'csv', label: 'CSV' },
      { value: 'xlsx', label: 'XLSX' },
      { value: 'jpg', label: 'JPG' },
      { value: 'png', label: 'PNG' }
    ]

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações do Sistema</h3>
          <button
            onClick={() => setEditingConfig(!editingConfig)}
            className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm"
          >
            <Settings size={16} />
            {editingConfig ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Settings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Upload className="text-blue-600" size={18} />
              Configurações de Upload
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tamanho máximo de arquivo (MB)</label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={configs.maxFileSize}
                    onChange={(e) => setConfigs({...configs, maxFileSize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">{configs.maxFileSize} MB</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipos de arquivo permitidos</label>
                {editingConfig ? (
                  <div className="grid grid-cols-2 gap-2">
                    {fileTypeOptions.map(type => (
                      <label key={type.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={configs.allowedFileTypes.includes(type.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setConfigs({...configs, allowedFileTypes: [...configs.allowedFileTypes, type.value]})
                            } else {
                              setConfigs({...configs, allowedFileTypes: configs.allowedFileTypes.filter(t => t !== type.value)})
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{type.label}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">
                    {configs.allowedFileTypes.join(', ').toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Settings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="text-yellow-600" size={18} />
              Performance
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Timeout de análise (segundos)</label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="60"
                    max="600"
                    value={configs.analysisTimeout}
                    onChange={(e) => setConfigs({...configs, analysisTimeout: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">{configs.analysisTimeout}s</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Máximo de conversas por usuário</label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={configs.maxConversations}
                    onChange={(e) => setConfigs({...configs, maxConversations: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">{configs.maxConversations} conversas</div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Cache habilitado</label>
                {editingConfig ? (
                  <input
                    type="checkbox"
                    checked={configs.enableCache}
                    onChange={(e) => setConfigs({...configs, enableCache: e.target.checked})}
                    className="rounded"
                  />
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs ${configs.enableCache ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {configs.enableCache ? 'Sim' : 'Não'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="text-red-600" size={18} />
              Segurança
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Timeout de sessão (horas)</label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={configs.sessionTimeout}
                    onChange={(e) => setConfigs({...configs, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">{configs.sessionTimeout}h</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Intervalo de auto-save (segundos)</label>
                {editingConfig ? (
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={configs.autoSaveInterval}
                    onChange={(e) => setConfigs({...configs, autoSaveInterval: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">{configs.autoSaveInterval}s</div>
                )}
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Server className="text-purple-600" size={18} />
              Sistema
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Frequência de backup</label>
                {editingConfig ? (
                  <select
                    value={configs.backupFrequency}
                    onChange={(e) => setConfigs({...configs, backupFrequency: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="hourly">A cada hora</option>
                    <option value="daily">Diário</option>
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </select>
                ) : (
                  <div className="text-gray-600 dark:text-gray-400">
                    {configs.backupFrequency === 'hourly' ? 'A cada hora' :
                     configs.backupFrequency === 'daily' ? 'Diário' :
                     configs.backupFrequency === 'weekly' ? 'Semanal' : 'Mensal'}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Notificações habilitadas</label>
                {editingConfig ? (
                  <input
                    type="checkbox"
                    checked={configs.enableNotifications}
                    onChange={(e) => setConfigs({...configs, enableNotifications: e.target.checked})}
                    className="rounded"
                  />
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs ${configs.enableNotifications ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {configs.enableNotifications ? 'Sim' : 'Não'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Modo manutenção</label>
                {editingConfig ? (
                  <input
                    type="checkbox"
                    checked={configs.maintenanceMode}
                    onChange={(e) => setConfigs({...configs, maintenanceMode: e.target.checked})}
                    className="rounded"
                  />
                ) : (
                  <span className={`px-2 py-1 rounded-full text-xs ${configs.maintenanceMode ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {configs.maintenanceMode ? 'Ativo' : 'Inativo'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {editingConfig && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setEditingConfig(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setEditingConfig(false)
                // Save configs logic here
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Salvar Configurações
            </button>
          </div>
        )}
      </div>
    )
  }

  // User Management Component
  const UserManagementSection = () => {
    const [users, setUsers] = useState([
      { id: 1, username: 'Admin', email: 'admin@financeai.com', role: 'user', isActive: true, lastLogin: '2025-06-27' },
      { id: 2, username: 'Leonardo', email: 'leonardo@financeai.com', role: 'admin', isActive: true, lastLogin: '2025-06-27' }
    ])
    const [showUserForm, setShowUserForm] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-minimal-xl text-gray-900 dark:text-white">Usuários do Sistema</h3>
          <button
            onClick={() => setShowUserForm(true)}
            className="btn-minimal flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        </div>

        <div className="grid gap-4">
          {users.map((user) => (
            <div key={user.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-content">
                  <div className="admin-card-title">
                    <User className="text-blue-600" size={20} />
                    <h4 className="text-gray-900 dark:text-white">{user.username}</h4>
                    <span className={`admin-status-badge ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    {user.isActive && (
                      <span className="admin-status-badge bg-green-100 text-green-800">Ativo</span>
                    )}
                  </div>
                  <div className="admin-card-details">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Último acesso:</strong> {user.lastLogin}
                    </p>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="btn-minimal admin-action-btn edit"
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => console.log('Toggle user status:', user.id)}
                    className="btn-minimal admin-action-btn delete"
                    title={user.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {user.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(showUserForm || editingUser) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-md">
              <h4 className="text-lg font-semibold mb-4">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </h4>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nome de usuário"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  defaultValue={editingUser?.username || ''}
                />
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  defaultValue={editingUser?.email || ''}
                />
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <option value="user">Usuário</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(null)
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowUserForm(false)
                    setEditingUser(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // LLM Configuration Component
  const LLMConfigSection = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações LLM</h3>
        <button
          onClick={() => setEditingItem({ type: 'llm', data: {} })}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={16} />
          Novo Provedor
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Carregando configurações...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {llmConfigs.map((config) => (
            <div key={config.id} className="admin-card">
              <div className="admin-card-header">
                <div className="admin-card-content">
                  <div className="admin-card-title">
                    <Cpu className="text-blue-600" size={20} />
                    <h4 className="text-gray-900 dark:text-white">{config.displayName}</h4>
                    {config.isEnabled && (
                      <span className="admin-status-badge bg-green-100 text-green-800">Ativo</span>
                    )}
                    {config.isPrimary && (
                      <span className="admin-status-badge bg-blue-100 text-blue-800">Primário</span>
                    )}
                  </div>
                  <div className="admin-card-details">
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Modelo:</strong> {config.model}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Especialidade:</strong> {config.specialty || 'Geral'}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <strong>Tokens:</strong> {config.maxTokens} | <strong>Temperatura:</strong> {config.temperature}
                    </p>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button
                    onClick={() => setEditingItem({ type: 'llm', data: config })}
                    className="admin-action-btn edit"
                    title="Editar"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => deleteItem('/api/admin/llm-configs', config.id)}
                    className="admin-action-btn delete"
                    title="Excluir"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const deleteItem = async (endpoint, id) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        // Reload data based on current tab
        switch (activeTab) {
          case 'llm':
            loadLlmConfigs()
            break
          case 'prompts':
            loadSystemPrompts()
            break
          case 'strategy':
            loadStrategies()
            break
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'llm':
        return <LLMConfigSection />
      case 'prompts':
        return <PromptsManagementSection />
      case 'strategy':
        return <StrategyManagementSection />
      case 'knowledge':
        return <KnowledgeBaseSection />
      case 'system':
        return <SystemConfigSection />
      case 'users':
        return <UserManagementSection />
      default:
        return <LLMConfigSection />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-xl">
          <div className="flex items-center gap-3">
            <Shield size={20} />
            <h2 className="text-lg font-bold">Painel Admin</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mobile-First Tabs Navigation */}
        <div className="admin-tabs-mobile">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`admin-tab-mobile ${
                  activeTab === tab.id
                    ? 'bg-purple-600 dark:bg-purple-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} className="mx-auto mb-1" />
                <span className="text-xs block">{tab.label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>

        {/* Content - Mobile-First Vertical Layout */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}