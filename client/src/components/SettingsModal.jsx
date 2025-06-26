import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, User, Shield, Database, Bell, Palette, 
  Globe, Lock, Eye, EyeOff, Save, RotateCcw, Download,
  Upload, Trash2, Key, Server, Zap, Brain, FileText,
  Mail, Phone, MapPin, Calendar, Camera, Edit3
} from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, currentTheme, onThemeChange }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [settings, setSettings] = useState({
    // Perfil do usuário
    profile: {
      name: 'Admin',
      email: 'admin@financeai.com',
      phone: '',
      location: 'Brasil',
      avatar: null,
      bio: 'Especialista em análise financeira',
      language: 'pt-BR'
    },
    // Configurações de interface
    interface: {
      theme: currentTheme || 'dark',
      interface_type: 'chatgpt', // chatgpt ou gemini
      compact_mode: false,
      show_sidebar: true,
      font_size: 'medium',
      animation_speed: 'normal',
      auto_scroll: true,
      message_grouping: true
    },
    // Configurações de IA
    ai: {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2048,
      system_prompt: 'Você é um assistente especializado em análise financeira e consultoria de crédito.',
      auto_save: true,
      context_memory: true,
      response_format: 'markdown'
    },
    // Notificações
    notifications: {
      desktop: true,
      sound: true,
      email: false,
      analysis_complete: true,
      new_features: true,
      security_alerts: true
    },
    // Privacidade e Segurança
    privacy: {
      data_retention: '90', // dias
      analytics: false,
      crash_reports: true,
      auto_delete_sensitive: true,
      two_factor: false,
      session_timeout: '60' // minutos
    },
    // Configurações avançadas
    advanced: {
      debug_mode: false,
      api_endpoint: 'https://api.openai.com',
      backup_frequency: 'daily',
      cache_size: '100', // MB
      concurrent_requests: '3',
      rate_limit: '10' // requests por minuto
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'interface', label: 'Interface', icon: Palette },
    { id: 'ai', label: 'IA & Modelos', icon: Brain },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'privacy', label: 'Privacidade', icon: Shield },
    { id: 'advanced', label: 'Avançado', icon: Settings }
  ];

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      // Salvar configurações no localStorage e/ou servidor
      localStorage.setItem('financeai_settings', JSON.stringify(settings));
      
      // Aplicar tema imediatamente
      if (onThemeChange && settings.interface.theme !== currentTheme) {
        onThemeChange(settings.interface.theme);
      }

      // Simular salvamento no servidor
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Configurações salvas:', settings);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar todas as configurações padrão? Esta ação não pode ser desfeita.')) {
      setSettings({
        // Restaurar configurações padrão
        profile: {
          name: 'Admin',
          email: 'admin@financeai.com',
          phone: '',
          location: 'Brasil',
          avatar: null,
          bio: 'Especialista em análise financeira',
          language: 'pt-BR'
        },
        interface: {
          theme: 'dark',
          interface_type: 'chatgpt',
          compact_mode: false,
          show_sidebar: true,
          font_size: 'medium',
          animation_speed: 'normal',
          auto_scroll: true,
          message_grouping: true
        },
        ai: {
          model: 'gpt-4o',
          temperature: 0.7,
          max_tokens: 2048,
          system_prompt: 'Você é um assistente especializado em análise financeira e consultoria de crédito.',
          auto_save: true,
          context_memory: true,
          response_format: 'markdown'
        },
        notifications: {
          desktop: true,
          sound: true,
          email: false,
          analysis_complete: true,
          new_features: true,
          security_alerts: true
        },
        privacy: {
          data_retention: '90',
          analytics: false,
          crash_reports: true,
          auto_delete_sensitive: true,
          two_factor: false,
          session_timeout: '60'
        },
        advanced: {
          debug_mode: false,
          api_endpoint: 'https://api.openai.com',
          backup_frequency: 'daily',
          cache_size: '100',
          concurrent_requests: '3',
          rate_limit: '10'
        }
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financeai-settings-${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          setSettings(importedSettings);
        } catch (error) {
          alert('Arquivo de configuração inválido');
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    // Carregar configurações salvas
    const savedSettings = localStorage.getItem('financeai_settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  if (!isOpen) return null;

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {settings.profile.name.charAt(0)}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded-full flex items-center justify-center transition-colors">
            <Camera size={12} />
          </button>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{settings.profile.name}</h3>
          <p className="text-gray-400 text-sm">{settings.profile.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
          <input
            type="text"
            value={settings.profile.name}
            onChange={(e) => updateSetting('profile', 'name', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
          <input
            type="email"
            value={settings.profile.email}
            onChange={(e) => updateSetting('profile', 'email', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Telefone</label>
          <input
            type="tel"
            value={settings.profile.phone}
            onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="(00) 00000-0000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Localização</label>
          <input
            type="text"
            value={settings.profile.location}
            onChange={(e) => updateSetting('profile', 'location', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
          <textarea
            value={settings.profile.bio}
            onChange={(e) => updateSetting('profile', 'bio', e.target.value)}
            rows={3}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Conte um pouco sobre você..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Idioma</label>
          <select
            value={settings.profile.language}
            onChange={(e) => updateSetting('profile', 'language', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (España)</option>
            <option value="fr-FR">Français (France)</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderInterfaceTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Interface</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateSetting('interface', 'interface_type', 'chatgpt')}
            className={`p-4 rounded-lg border-2 transition-all ${
              settings.interface.interface_type === 'chatgpt'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-white font-medium">ChatGPT Style</div>
            <div className="text-gray-400 text-sm">Interface familiar e intuitiva</div>
          </button>
          <button
            onClick={() => updateSetting('interface', 'interface_type', 'gemini')}
            className={`p-4 rounded-lg border-2 transition-all ${
              settings.interface.interface_type === 'gemini'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-600 hover:border-gray-500'
            }`}
          >
            <div className="text-white font-medium">Gemini Style</div>
            <div className="text-gray-400 text-sm">Interface moderna e dinâmica</div>
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Tema</label>
        <div className="grid grid-cols-3 gap-3">
          {['light', 'dark', 'auto'].map((theme) => (
            <button
              key={theme}
              onClick={() => updateSetting('interface', 'theme', theme)}
              className={`p-3 rounded-lg border-2 transition-all capitalize ${
                settings.interface.theme === theme
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-white font-medium">
                {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Automático'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tamanho da Fonte</label>
          <select
            value={settings.interface.font_size}
            onChange={(e) => updateSetting('interface', 'font_size', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="small">Pequeno</option>
            <option value="medium">Médio</option>
            <option value="large">Grande</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Velocidade das Animações</label>
          <select
            value={settings.interface.animation_speed}
            onChange={(e) => updateSetting('interface', 'animation_speed', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="slow">Lenta</option>
            <option value="normal">Normal</option>
            <option value="fast">Rápida</option>
            <option value="none">Sem animações</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Modo Compacto</label>
          <button
            onClick={() => updateSetting('interface', 'compact_mode', !settings.interface.compact_mode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.interface.compact_mode ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.interface.compact_mode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Mostrar Sidebar</label>
          <button
            onClick={() => updateSetting('interface', 'show_sidebar', !settings.interface.show_sidebar)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.interface.show_sidebar ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.interface.show_sidebar ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Auto Scroll</label>
          <button
            onClick={() => updateSetting('interface', 'auto_scroll', !settings.interface.auto_scroll)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.interface.auto_scroll ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.interface.auto_scroll ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Agrupar Mensagens</label>
          <button
            onClick={() => updateSetting('interface', 'message_grouping', !settings.interface.message_grouping)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.interface.message_grouping ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.interface.message_grouping ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );

  const renderAITab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Modelo de IA</label>
        <select
          value={settings.ai.model}
          onChange={(e) => updateSetting('ai', 'model', e.target.value)}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="gpt-4o">GPT-4o (Recomendado)</option>
          <option value="gpt-4">GPT-4</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
          <option value="claude-3-opus">Claude 3 Opus</option>
          <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          <option value="gemini-pro">Gemini Pro</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Temperatura ({settings.ai.temperature})
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.ai.temperature}
            onChange={(e) => updateSetting('ai', 'temperature', parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Conservador</span>
            <span>Criativo</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Max Tokens</label>
          <input
            type="number"
            value={settings.ai.max_tokens}
            onChange={(e) => updateSetting('ai', 'max_tokens', parseInt(e.target.value))}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="100"
            max="4000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">System Prompt</label>
        <textarea
          value={settings.ai.system_prompt}
          onChange={(e) => updateSetting('ai', 'system_prompt', e.target.value)}
          rows={4}
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Defina o comportamento da IA..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Formato de Resposta</label>
        <div className="grid grid-cols-3 gap-3">
          {['markdown', 'text', 'structured'].map((format) => (
            <button
              key={format}
              onClick={() => updateSetting('ai', 'response_format', format)}
              className={`p-3 rounded-lg border-2 transition-all capitalize ${
                settings.ai.response_format === format
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-white font-medium">
                {format === 'markdown' ? 'Markdown' : format === 'text' ? 'Texto' : 'Estruturado'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Auto Save</label>
          <button
            onClick={() => updateSetting('ai', 'auto_save', !settings.ai.auto_save)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.ai.auto_save ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.ai.auto_save ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Memória de Contexto</label>
          <button
            onClick={() => updateSetting('ai', 'context_memory', !settings.ai.context_memory)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.ai.context_memory ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.ai.context_memory ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <div className="flex items-center gap-3 mb-3">
          <Key size={16} className="text-gray-400" />
          <label className="text-sm font-medium text-gray-300">Chave da API OpenAI</label>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <button
            onClick={() => {
              // Salvar chave da API
              if (tempApiKey.trim()) {
                localStorage.setItem('openai_api_key', tempApiKey.trim());
                setTempApiKey('');
                alert('Chave da API salva com sucesso!');
              }
            }}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white">Notificações do Sistema</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Notificações Desktop</label>
              <p className="text-xs text-gray-500">Receber notificações no desktop</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', 'desktop', !settings.notifications.desktop)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.desktop ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.desktop ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Sons</label>
              <p className="text-xs text-gray-500">Reproduzir sons de notificação</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', 'sound', !settings.notifications.sound)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.sound ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.sound ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Email</label>
              <p className="text-xs text-gray-500">Receber notificações por email</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', 'email', !settings.notifications.email)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.email ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.email ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-medium text-white">Eventos Específicos</h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Análise Completa</label>
              <p className="text-xs text-gray-500">Quando uma análise financeira for concluída</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', 'analysis_complete', !settings.notifications.analysis_complete)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.analysis_complete ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.analysis_complete ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Novos Recursos</label>
              <p className="text-xs text-gray-500">Quando novos recursos estiverem disponíveis</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', 'new_features', !settings.notifications.new_features)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.new_features ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.new_features ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">Alertas de Segurança</label>
              <p className="text-xs text-gray-500">Notificações sobre segurança da conta</p>
            </div>
            <button
              onClick={() => updateSetting('notifications', 'security_alerts', !settings.notifications.security_alerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.notifications.security_alerts ? 'bg-blue-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications.security_alerts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Retenção de Dados (dias)</label>
          <input
            type="number"
            value={settings.privacy.data_retention}
            onChange={(e) => updateSetting('privacy', 'data_retention', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="365"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Timeout da Sessão (minutos)</label>
          <input
            type="number"
            value={settings.privacy.session_timeout}
            onChange={(e) => updateSetting('privacy', 'session_timeout', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="5"
            max="480"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Analytics</label>
            <p className="text-xs text-gray-500">Permitir coleta de dados de uso anônimos</p>
          </div>
          <button
            onClick={() => updateSetting('privacy', 'analytics', !settings.privacy.analytics)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.privacy.analytics ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.analytics ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Relatórios de Crash</label>
            <p className="text-xs text-gray-500">Enviar relatórios automáticos de erro</p>
          </div>
          <button
            onClick={() => updateSetting('privacy', 'crash_reports', !settings.privacy.crash_reports)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.privacy.crash_reports ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.crash_reports ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Auto Delete Dados Sensíveis</label>
            <p className="text-xs text-gray-500">Deletar automaticamente dados financeiros antigos</p>
          </div>
          <button
            onClick={() => updateSetting('privacy', 'auto_delete_sensitive', !settings.privacy.auto_delete_sensitive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.privacy.auto_delete_sensitive ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.auto_delete_sensitive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Autenticação de Dois Fatores</label>
            <p className="text-xs text-gray-500">Adicionar camada extra de segurança</p>
          </div>
          <button
            onClick={() => updateSetting('privacy', 'two_factor', !settings.privacy.two_factor)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.privacy.two_factor ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.privacy.two_factor ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <div className="flex gap-3">
          <button
            onClick={() => {
              if (confirm('Deseja deletar todos os dados pessoais? Esta ação não pode ser desfeita.')) {
                console.log('Deletando dados pessoais...');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <Trash2 size={16} />
            Deletar Dados Pessoais
          </button>
          <button
            onClick={() => {
              console.log('Baixando dados pessoais...');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Baixar Meus Dados
          </button>
        </div>
      </div>
    </div>
  );

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">API Endpoint</label>
          <input
            type="url"
            value={settings.advanced.api_endpoint}
            onChange={(e) => updateSetting('advanced', 'api_endpoint', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Frequência de Backup</label>
          <select
            value={settings.advanced.backup_frequency}
            onChange={(e) => updateSetting('advanced', 'backup_frequency', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="never">Nunca</option>
            <option value="daily">Diário</option>
            <option value="weekly">Semanal</option>
            <option value="monthly">Mensal</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Tamanho do Cache (MB)</label>
          <input
            type="number"
            value={settings.advanced.cache_size}
            onChange={(e) => updateSetting('advanced', 'cache_size', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="10"
            max="1000"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Requisições Concorrentes</label>
          <input
            type="number"
            value={settings.advanced.concurrent_requests}
            onChange={(e) => updateSetting('advanced', 'concurrent_requests', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Rate Limit (req/min)</label>
          <input
            type="number"
            value={settings.advanced.rate_limit}
            onChange={(e) => updateSetting('advanced', 'rate_limit', e.target.value)}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="1"
            max="100"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-300">Modo Debug</label>
            <p className="text-xs text-gray-500">Ativar logs detalhados para depuração</p>
          </div>
          <button
            onClick={() => updateSetting('advanced', 'debug_mode', !settings.advanced.debug_mode)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.advanced.debug_mode ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.advanced.debug_mode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-600 pt-4">
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download size={16} />
            Exportar Configurações
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors cursor-pointer">
            <Upload size={16} />
            Importar Configurações
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-4xl h-[90vh] bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Configurações</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 border-r border-gray-700 overflow-y-auto">
              <div className="p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1 ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <tab.icon size={18} />
                    <span className="text-sm font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                {activeTab === 'profile' && renderProfileTab()}
                {activeTab === 'interface' && renderInterfaceTab()}
                {activeTab === 'ai' && renderAITab()}
                {activeTab === 'notifications' && renderNotificationsTab()}
                {activeTab === 'privacy' && renderPrivacyTab()}
                {activeTab === 'advanced' && renderAdvancedTab()}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-700">
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RotateCcw size={16} />
                Restaurar Padrão
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <Save size={16} />
                Salvar
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SettingsModal;