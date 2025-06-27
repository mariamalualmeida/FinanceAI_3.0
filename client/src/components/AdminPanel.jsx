import { useState, useEffect } from 'react'
import { 
  Settings, 
  Users, 
  Database, 
  Key, 
  FileText, 
  Upload,
  Trash2,
  Edit3,
  Save,
  X,
  BookOpen,
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Cpu,
  Zap
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Usuários do Sistema</h3>
          <button
            onClick={() => setShowUserForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus size={16} />
            Novo Usuário
          </button>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <div key={user.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <User className="text-blue-600" size={18} />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{user.username}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? 'Administrador' : 'Usuário'}
                    </span>
                    {user.isActive && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Ativo</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Email: {user.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    Último acesso: {user.lastLogin}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => console.log('Toggle user status:', user.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    {user.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
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
            <div key={config.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Cpu className="text-blue-600" size={20} />
                    <h4 className="font-semibold text-gray-900 dark:text-white">{config.displayName}</h4>
                    {config.isEnabled && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Ativo</span>
                    )}
                    {config.isPrimary && (
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Primário</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Modelo: {config.model} | Especialidade: {config.specialty || 'Geral'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Tokens: {config.maxTokens} | Temperatura: {config.temperature}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingItem({ type: 'llm', data: config })}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteItem('/api/admin/llm-configs', config.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={16} />
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
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Prompts do Sistema</h3>
            <p className="text-gray-600 dark:text-gray-400">Configure os prompts utilizados pelo sistema Multi-LLM.</p>
            <div className="text-center py-8 text-gray-500">
              Seção em desenvolvimento
            </div>
          </div>
        )
      case 'strategy':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estratégias Multi-LLM</h3>
            <p className="text-gray-600 dark:text-gray-400">Gerencie as estratégias de orquestração dos LLMs.</p>
            <div className="text-center py-8 text-gray-500">
              Seção em desenvolvimento
            </div>
          </div>
        )
      case 'knowledge':
        return <KnowledgeBaseSection />
      case 'system':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configurações do Sistema</h3>
            <p className="text-gray-600 dark:text-gray-400">Configure parâmetros gerais do sistema.</p>
            <div className="text-center py-8 text-gray-500">
              Seção em desenvolvimento
            </div>
          </div>
        )
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
        <div className="overflow-x-auto border-b border-gray-200 dark:border-gray-700">
          <div className="flex min-w-max px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-3 border-b-2 transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>
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