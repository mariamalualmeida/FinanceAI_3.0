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
  Plus
} from 'lucide-react'

export default function AdminPanel({ user, onClose }) {
  const [activeTab, setActiveTab] = useState('general')
  const [configs, setConfigs] = useState([])
  const [knowledgeBase, setKnowledgeBase] = useState([])
  const [fileUploads, setFileUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [newConfig, setNewConfig] = useState({ key: '', value: '', description: '', category: 'general' })
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Acesso Negado</h2>
          <p className="text-gray-600 mb-4">Você não tem permissão para acessar o painel administrativo.</p>
          <button onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">
            Fechar
          </button>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'Configurações Gerais', icon: Settings },
    { id: 'credentials', label: 'Credenciais', icon: Key },
    { id: 'knowledge', label: 'Base de Conhecimento', icon: BookOpen },
    { id: 'files', label: 'Uploads', icon: FileText },
    { id: 'users', label: 'Usuários', icon: Users }
  ]

  // Load data based on active tab
  useEffect(() => {
    loadTabData()
  }, [activeTab])

  const loadTabData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'general':
        case 'credentials':
          const configRes = await fetch('/api/admin/configs', { credentials: 'include' })
          if (configRes.ok) {
            const configs = await configRes.json()
            setConfigs(configs)
          }
          break
        case 'knowledge':
          const kbRes = await fetch('/api/admin/knowledge-base', { credentials: 'include' })
          if (kbRes.ok) {
            const kb = await kbRes.json()
            setKnowledgeBase(kb)
          }
          break
        case 'files':
          const filesRes = await fetch('/api/admin/file-uploads', { credentials: 'include' })
          if (filesRes.ok) {
            const files = await filesRes.json()
            setFileUploads(files)
          }
          break
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (config) => {
    try {
      const response = await fetch('/api/admin/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(config)
      })
      
      if (response.ok) {
        loadTabData()
        setEditingConfig(null)
        setNewConfig({ key: '', value: '', description: '', category: 'general' })
      }
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  const deleteItem = async (endpoint, id) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return
    
    try {
      const response = await fetch(`${endpoint}/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (response.ok) {
        loadTabData()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const uploadKnowledgeFile = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('category', 'knowledge')
    
    try {
      const response = await fetch('/api/admin/knowledge-base/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      
      if (response.ok) {
        loadTabData()
      }
    } catch (error) {
      console.error('Error uploading file:', error)
    }
  }

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Configurações Gerais</h3>
        <button
          onClick={() => setEditingConfig('new')}
          className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus size={16} />
          Nova Configuração
        </button>
      </div>

      {editingConfig === 'new' && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h4 className="font-medium mb-4">Nova Configuração</h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Chave"
              value={newConfig.key}
              onChange={(e) => setNewConfig(prev => ({ ...prev, key: e.target.value }))}
              className="border rounded px-3 py-2"
            />
            <select
              value={newConfig.category}
              onChange={(e) => setNewConfig(prev => ({ ...prev, category: e.target.value }))}
              className="border rounded px-3 py-2"
            >
              <option value="general">Geral</option>
              <option value="ui">Interface</option>
              <option value="ai">IA</option>
            </select>
            <input
              type="text"
              placeholder="Valor"
              value={newConfig.value}
              onChange={(e) => setNewConfig(prev => ({ ...prev, value: e.target.value }))}
              className="border rounded px-3 py-2 col-span-2"
            />
            <input
              type="text"
              placeholder="Descrição"
              value={newConfig.description}
              onChange={(e) => setNewConfig(prev => ({ ...prev, description: e.target.value }))}
              className="border rounded px-3 py-2 col-span-2"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => saveConfig(newConfig)}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Salvar
            </button>
            <button
              onClick={() => setEditingConfig(null)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {configs.filter(c => c.category === 'general').map((config) => (
          <div key={config.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{config.key}</h4>
                <p className="text-sm text-gray-600">{config.description}</p>
                <p className="text-sm text-gray-800 mt-1">{config.value}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingConfig(config.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => deleteItem('/api/admin/configs', config.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderCredentials = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Gestão de Credenciais</h3>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">⚠️ Credenciais Sensíveis</h4>
        <p className="text-sm text-yellow-700">
          As configurações abaixo contêm informações sensíveis. Tenha cuidado ao editá-las.
        </p>
      </div>

      <div className="space-y-3">
        {configs.filter(c => c.category === 'credentials' || c.isSecret).map((config) => (
          <div key={config.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{config.key}</h4>
                <p className="text-sm text-gray-600">{config.description}</p>
                <p className="text-sm text-gray-800 mt-1">
                  {config.isSecret ? '●●●●●●●●' : config.value}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingConfig(config.id)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderKnowledgeBase = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Base de Conhecimento</h3>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => e.target.files[0] && uploadKnowledgeFile(e.target.files[0])}
            className="hidden"
            id="knowledge-upload"
          />
          <label
            htmlFor="knowledge-upload"
            className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-600 cursor-pointer"
          >
            <Upload size={16} />
            Upload Documento
          </label>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="all">Todas as categorias</option>
          <option value="general">Geral</option>
          <option value="finance">Finanças</option>
          <option value="legal">Legal</option>
          <option value="guides">Guias</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeBase
          .filter(kb => 
            (selectedCategory === 'all' || kb.category === selectedCategory) &&
            (searchTerm === '' || kb.title.toLowerCase().includes(searchTerm.toLowerCase()))
          )
          .map((kb) => (
            <div key={kb.id} className="bg-white border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{kb.title}</h4>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingConfig(kb.id)}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => deleteItem('/api/admin/knowledge-base', kb.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-2">{kb.description}</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{kb.category}</span>
                <span>{kb.fileType}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{(kb.fileSize / 1024).toFixed(1)} KB</span>
                <span>{new Date(kb.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )

  const renderFileUploads = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Gestão de Uploads</h3>
      
      <div className="space-y-3">
        {fileUploads.map((file) => (
          <div key={file.id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{file.filename}</h4>
                <p className="text-sm text-gray-600">
                  Status: <span className={`font-medium ${
                    file.status === 'completed' ? 'text-green-600' : 
                    file.status === 'processing' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {file.status}
                  </span>
                </p>
                <div className="flex gap-4 text-xs text-gray-500 mt-1">
                  <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                  <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => deleteItem('/api/admin/file-uploads', file.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUsers = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Gestão de Usuários</h3>
      
      <div className="space-y-3">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium">Usuário Padrão</h4>
          <p className="text-sm text-gray-600">Credenciais configuráveis</p>
          <div className="mt-2">
            <input 
              type="text" 
              placeholder="Novo usuário" 
              className="border rounded px-3 py-2 mr-2"
            />
            <input 
              type="password" 
              placeholder="Nova senha" 
              className="border rounded px-3 py-2 mr-2"
            />
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Atualizar
            </button>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium">Administrador</h4>
          <p className="text-sm text-gray-600">Leonardo (Acesso total)</p>
          <p className="text-xs text-gray-500 mt-1">
            Usuário: Leonardo | Status: Ativo
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Painel Administrativo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <div className="border-b">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <IconComponent size={18} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-600">Carregando...</div>
            </div>
          ) : (
            <>
              {activeTab === 'general' && renderGeneralSettings()}
              {activeTab === 'credentials' && renderCredentials()}
              {activeTab === 'knowledge' && renderKnowledgeBase()}
              {activeTab === 'files' && renderFileUploads()}
              {activeTab === 'users' && renderUsers()}
            </>
          )}
        </div>
      </div>
    </div>
  )
}