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
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Base de Conhecimento</h3>
            <p className="text-gray-600 dark:text-gray-400">Gerencie documentos da base de conhecimento do sistema.</p>
            <div className="text-center py-8 text-gray-500">
              Seção em desenvolvimento
            </div>
          </div>
        )
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
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Gerenciamento de Usuários</h3>
            <p className="text-gray-600 dark:text-gray-400">Gerencie usuários e permissões do sistema.</p>
            <div className="text-center py-8 text-gray-500">
              Seção em desenvolvimento
            </div>
          </div>
        )
      default:
        return <LLMConfigSection />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}