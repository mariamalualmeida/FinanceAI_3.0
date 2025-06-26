import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Settings, User, Shield, Database, Bell, Palette, 
  Globe, Lock, Eye, EyeOff, Save, RotateCcw, 
  Key, Server, Zap, Brain, ChevronDown, ChevronRight,
  Mail, Phone, MapPin, Calendar, Camera, Edit3
} from 'lucide-react';

const ExpandableSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon size={20} className="text-gray-600 dark:text-gray-400" />
          <span className="font-medium text-gray-900 dark:text-gray-100">{title}</span>
        </div>
        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white dark:bg-gray-900"
          >
            <div className="p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField = ({ label, type = "text", value, onChange, placeholder, icon: Icon, showToggle = false }) => {
  const [showValue, setShowValue] = useState(false);
  const actualType = showToggle ? (showValue ? 'text' : 'password') : type;

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
        {Icon && <Icon size={16} />}
        {label}
      </label>
      <div className="relative">
        <input
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {showToggle && (
          <button
            type="button"
            onClick={() => setShowValue(!showValue)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options, icon: Icon }) => (
  <div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
      {Icon && <Icon size={16} />}
      {label}
    </label>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const ToggleField = ({ label, value, onChange, description, icon: Icon }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={16} className="text-gray-600 dark:text-gray-400" />}
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
        )}
      </div>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const NewSettingsModal = ({ isOpen, onClose, currentTheme, onThemeChange, user }) => {
  const [settings, setSettings] = useState({
    // Perfil do usuário
    profile: {
      name: user?.username || 'Admin',
      email: user?.email || 'admin@financeai.com',
      phone: '',
      location: 'Brasil',
      bio: 'Especialista em análise financeira',
      language: 'pt-BR'
    },
    // Configurações de interface
    interface: {
      theme: currentTheme || 'dark',
      interface_type: 'chatgpt',
      compact_mode: false,
      show_sidebar: true,
      font_size: 'medium',
      animation_speed: 'normal',
      auto_scroll: true
    },
    // APIs e Integrações
    apis: {
      openai_key: '',
      anthropic_key: '',
      google_key: '',
      whisper_enabled: true,
      default_model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2048
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
    // Segurança e Privacidade
    security: {
      two_factor: false,
      session_timeout: 30,
      auto_logout: true,
      data_retention: 90,
      encryption: true
    },
    // Sistema e Performance
    system: {
      auto_save: true,
      cache_enabled: true,
      performance_mode: false,
      debug_mode: false,
      analytics: true
    },
    // Multi-LLM Strategy
    multiLlm: {
      mode: 'economic',
      subjectRouting: false,
      backupSystem: true,
      crossValidation: false,
      primaryAI: 'openai',
      backupAI: 'anthropic',
      validationAI: 'google'
    },
    // Sistema de Prompts
    prompts: {
      activeSet: 'financial_analysis',
      sequential: true,
      validateOutput: true,
      prompt1: 'Você é um consultor financeiro especializado em análise de crédito e detecção de riscos.',
      prompt2: '',
      prompt3: '',
      prompt4: '',
      prompt5: '',
      prompt6: '',
      prompt7: '',
      prompt8: '',
      prompt9: '',
      prompt10: '',
      prompt11: '',
      prompt12: ''
    }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Verificar se o usuário é admin
    setIsAdmin(user?.role === 'admin');
  }, [user]);

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Aplicar tema imediatamente
    if (onThemeChange && settings.interface.theme !== currentTheme) {
      onThemeChange(settings.interface.theme);
    }
    
    // Aqui salvaria as configurações no backend
    console.log('Saving settings:', settings);
    setHasChanges(false);
    
    // Feedback visual
    const saveButton = document.querySelector('[data-save-button]');
    if (saveButton) {
      saveButton.textContent = 'Salvo!';
      setTimeout(() => {
        saveButton.textContent = 'Salvar Configurações';
      }, 2000);
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setSettings(prev => ({
        ...prev,
        interface: {
          theme: 'dark',
          interface_type: 'chatgpt',
          compact_mode: false,
          show_sidebar: true,
          font_size: 'medium',
          animation_speed: 'normal',
          auto_scroll: true
        }
      }));
      setHasChanges(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Configurações
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Perfil do Usuário */}
            <ExpandableSection title="Perfil do Usuário" icon={User} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Nome"
                  value={settings.profile.name}
                  onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                  placeholder="Seu nome completo"
                  icon={User}
                />
                <InputField
                  label="Email"
                  type="email"
                  value={settings.profile.email}
                  onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                  placeholder="seu@email.com"
                  icon={Mail}
                />
                <InputField
                  label="Telefone"
                  value={settings.profile.phone}
                  onChange={(e) => updateSetting('profile', 'phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  icon={Phone}
                />
                <InputField
                  label="Localização"
                  value={settings.profile.location}
                  onChange={(e) => updateSetting('profile', 'location', e.target.value)}
                  placeholder="Cidade, Estado"
                  icon={MapPin}
                />
              </div>
            </ExpandableSection>

            {/* Interface */}
            <ExpandableSection title="Interface e Aparência" icon={Palette}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField
                  label="Tema"
                  value={settings.interface.theme}
                  onChange={(e) => updateSetting('interface', 'theme', e.target.value)}
                  options={[
                    { value: 'light', label: 'Claro' },
                    { value: 'dark', label: 'Escuro' },
                    { value: 'system', label: 'Sistema' }
                  ]}
                  icon={Palette}
                />
                <SelectField
                  label="Estilo da Interface"
                  value={settings.interface.interface_type}
                  onChange={(e) => updateSetting('interface', 'interface_type', e.target.value)}
                  options={[
                    { value: 'chatgpt', label: 'ChatGPT' },
                    { value: 'gemini', label: 'Gemini' }
                  ]}
                  icon={Globe}
                />
                <SelectField
                  label="Tamanho da Fonte"
                  value={settings.interface.font_size}
                  onChange={(e) => updateSetting('interface', 'font_size', e.target.value)}
                  options={[
                    { value: 'small', label: 'Pequena' },
                    { value: 'medium', label: 'Média' },
                    { value: 'large', label: 'Grande' }
                  ]}
                  icon={Edit3}
                />
                <SelectField
                  label="Velocidade das Animações"
                  value={settings.interface.animation_speed}
                  onChange={(e) => updateSetting('interface', 'animation_speed', e.target.value)}
                  options={[
                    { value: 'slow', label: 'Lenta' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'fast', label: 'Rápida' }
                  ]}
                  icon={Zap}
                />
              </div>
              <div className="space-y-3">
                <ToggleField
                  label="Modo Compacto"
                  value={settings.interface.compact_mode}
                  onChange={(value) => updateSetting('interface', 'compact_mode', value)}
                  description="Interface mais compacta para telas menores"
                  icon={Database}
                />
                <ToggleField
                  label="Mostrar Sidebar"
                  value={settings.interface.show_sidebar}
                  onChange={(value) => updateSetting('interface', 'show_sidebar', value)}
                  description="Exibir sidebar de conversas"
                  icon={Palette}
                />
                <ToggleField
                  label="Rolagem Automática"
                  value={settings.interface.auto_scroll}
                  onChange={(value) => updateSetting('interface', 'auto_scroll', value)}
                  description="Rolar automaticamente para novas mensagens"
                  icon={Globe}
                />
              </div>
            </ExpandableSection>

            {/* APIs e IA - Restrito para Admin */}
            {isAdmin && (
              <ExpandableSection title="APIs e Inteligência Artificial" icon={Brain}>
                <div className="space-y-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <Shield size={16} className="inline mr-2" />
                      Seção restrita para administradores. Configure suas chaves de API aqui.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <InputField
                      label="OpenAI API Key"
                      value={settings.apis.openai_key}
                      onChange={(e) => updateSetting('apis', 'openai_key', e.target.value)}
                      placeholder="sk-..."
                      icon={Key}
                      showToggle={true}
                    />
                    <InputField
                      label="Anthropic API Key"
                      value={settings.apis.anthropic_key}
                      onChange={(e) => updateSetting('apis', 'anthropic_key', e.target.value)}
                      placeholder="sk-ant-..."
                      icon={Key}
                      showToggle={true}
                    />
                    <InputField
                      label="Google AI API Key"
                      value={settings.apis.google_key}
                      onChange={(e) => updateSetting('apis', 'google_key', e.target.value)}
                      placeholder="AI..."
                      icon={Key}
                      showToggle={true}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SelectField
                      label="Modelo Padrão"
                      value={settings.apis.default_model}
                      onChange={(e) => updateSetting('apis', 'default_model', e.target.value)}
                      options={[
                        { value: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
                        { value: 'claude-sonnet-4', label: 'Claude Sonnet 4.0 (Anthropic)' },
                        { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Google)' }
                      ]}
                      icon={Brain}
                    />
                    <SelectField
                      label="Temperatura"
                      value={settings.apis.temperature.toString()}
                      onChange={(e) => updateSetting('apis', 'temperature', parseFloat(e.target.value))}
                      options={[
                        { value: '0.1', label: '0.1 (Muito Conservador)' },
                        { value: '0.5', label: '0.5 (Conservador)' },
                        { value: '0.7', label: '0.7 (Balanceado)' },
                        { value: '0.9', label: '0.9 (Criativo)' },
                        { value: '1.0', label: '1.0 (Muito Criativo)' }
                      ]}
                      icon={Zap}
                    />
                  </div>

                  <ToggleField
                    label="Whisper (Transcrição de Áudio)"
                    value={settings.apis.whisper_enabled}
                    onChange={(value) => updateSetting('apis', 'whisper_enabled', value)}
                    description="Habilitar transcrição automática de áudio"
                    icon={Server}
                  />
                </div>
              </ExpandableSection>
            )}

            {/* Notificações */}
            <ExpandableSection title="Notificações" icon={Bell}>
              <div className="space-y-3">
                <ToggleField
                  label="Notificações Desktop"
                  value={settings.notifications.desktop}
                  onChange={(value) => updateSetting('notifications', 'desktop', value)}
                  description="Mostrar notificações do navegador"
                  icon={Bell}
                />
                <ToggleField
                  label="Sons"
                  value={settings.notifications.sound}
                  onChange={(value) => updateSetting('notifications', 'sound', value)}
                  description="Reproduzir sons para notificações"
                  icon={Zap}
                />
                <ToggleField
                  label="Análise Completa"
                  value={settings.notifications.analysis_complete}
                  onChange={(value) => updateSetting('notifications', 'analysis_complete', value)}
                  description="Notificar quando análises forem concluídas"
                  icon={Database}
                />
                <ToggleField
                  label="Novos Recursos"
                  value={settings.notifications.new_features}
                  onChange={(value) => updateSetting('notifications', 'new_features', value)}
                  description="Receber notificações sobre atualizações"
                  icon={Zap}
                />
              </div>
            </ExpandableSection>

            {/* Segurança - Restrito para Admin */}
            {isAdmin && (
              <ExpandableSection title="Segurança e Privacidade" icon={Shield}>
                <div className="space-y-3">
                  <ToggleField
                    label="Autenticação de Dois Fatores"
                    value={settings.security.two_factor}
                    onChange={(value) => updateSetting('security', 'two_factor', value)}
                    description="Adicionar camada extra de segurança"
                    icon={Lock}
                  />
                  <ToggleField
                    label="Logout Automático"
                    value={settings.security.auto_logout}
                    onChange={(value) => updateSetting('security', 'auto_logout', value)}
                    description="Fazer logout automaticamente após inatividade"
                    icon={Shield}
                  />
                  <ToggleField
                    label="Criptografia de Dados"
                    value={settings.security.encryption}
                    onChange={(value) => updateSetting('security', 'encryption', value)}
                    description="Criptografar dados sensíveis"
                    icon={Lock}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SelectField
                    label="Timeout da Sessão"
                    value={settings.security.session_timeout.toString()}
                    onChange={(e) => updateSetting('security', 'session_timeout', parseInt(e.target.value))}
                    options={[
                      { value: '15', label: '15 minutos' },
                      { value: '30', label: '30 minutos' },
                      { value: '60', label: '1 hora' },
                      { value: '120', label: '2 horas' }
                    ]}
                    icon={Calendar}
                  />
                  <SelectField
                    label="Retenção de Dados"
                    value={settings.security.data_retention.toString()}
                    onChange={(e) => updateSetting('security', 'data_retention', parseInt(e.target.value))}
                    options={[
                      { value: '30', label: '30 dias' },
                      { value: '90', label: '90 dias' },
                      { value: '180', label: '180 dias' },
                      { value: '365', label: '1 ano' }
                    ]}
                    icon={Database}
                  />
                </div>
              </ExpandableSection>
            )}

            {/* Multi-LLM Strategy - Restrito para Admin */}
            {isAdmin && (
              <ExpandableSection title="Estratégia Multi-LLM" icon={Brain}>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Configuração Avançada de IA
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Configure como múltiplas IAs trabalham juntas para análises mais precisas
                    </p>
                  </div>

                  <SelectField
                    label="Modo de Operação"
                    value={settings.multiLlm?.mode || 'economic'}
                    onChange={(e) => updateSetting('multiLlm', 'mode', e.target.value)}
                    options={[
                      { value: 'economic', label: 'Econômico - Uma IA principal + backup' },
                      { value: 'balanced', label: 'Balanceado - Roteamento inteligente + backup' },
                      { value: 'premium', label: 'Premium - Sistema completo com validação' }
                    ]}
                    icon={Brain}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ToggleField
                      label="Roteamento por Assunto"
                      value={settings.multiLlm?.subjectRouting || false}
                      onChange={(value) => updateSetting('multiLlm', 'subjectRouting', value)}
                      description="Direcionar assuntos para IA especializada"
                    />
                    <ToggleField
                      label="Sistema de Backup"
                      value={settings.multiLlm?.backupSystem || true}
                      onChange={(value) => updateSetting('multiLlm', 'backupSystem', value)}
                      description="IA backup em caso de falha"
                    />
                    <ToggleField
                      label="Validação Cruzada"
                      value={settings.multiLlm?.crossValidation || false}
                      onChange={(value) => updateSetting('multiLlm', 'crossValidation', value)}
                      description="Validar respostas com segunda IA"
                    />
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      Configuração de Prioridades
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SelectField
                        label="IA Primária"
                        value={settings.multiLlm?.primaryAI || 'openai'}
                        onChange={(e) => updateSetting('multiLlm', 'primaryAI', e.target.value)}
                        options={[
                          { value: 'openai', label: 'OpenAI GPT-4o' },
                          { value: 'anthropic', label: 'Claude Sonnet 4' },
                          { value: 'google', label: 'Gemini 2.5 Pro' }
                        ]}
                      />
                      <SelectField
                        label="IA de Backup"
                        value={settings.multiLlm?.backupAI || 'anthropic'}
                        onChange={(e) => updateSetting('multiLlm', 'backupAI', e.target.value)}
                        options={[
                          { value: 'openai', label: 'OpenAI GPT-4o' },
                          { value: 'anthropic', label: 'Claude Sonnet 4' },
                          { value: 'google', label: 'Gemini 2.5 Pro' }
                        ]}
                      />
                      <SelectField
                        label="IA de Validação"
                        value={settings.multiLlm?.validationAI || 'google'}
                        onChange={(e) => updateSetting('multiLlm', 'validationAI', e.target.value)}
                        options={[
                          { value: 'openai', label: 'OpenAI GPT-4o' },
                          { value: 'anthropic', label: 'Claude Sonnet 4' },
                          { value: 'google', label: 'Gemini 2.5 Pro' }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Sistema de Prompts - Restrito para Admin */}
            {isAdmin && (
              <ExpandableSection title="Sistema de Prompts" icon={Edit3}>
                <div className="space-y-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
                      Prompts Personalizados
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Configure até 12 prompts em cadeia para análises mais precisas
                    </p>
                  </div>

                  <SelectField
                    label="Conjunto de Prompts Ativo"
                    value={settings.prompts?.activeSet || 'financial_analysis'}
                    onChange={(e) => updateSetting('prompts', 'activeSet', e.target.value)}
                    options={[
                      { value: 'financial_analysis', label: 'Análise Financeira Padrão' },
                      { value: 'credit_scoring', label: 'Score de Crédito Avançado' },
                      { value: 'risk_detection', label: 'Detecção de Riscos' },
                      { value: 'custom', label: 'Personalizado' }
                    ]}
                    icon={Edit3}
                  />

                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      Prompts da Cadeia (12 campos disponíveis)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className="space-y-2">
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Prompt {i + 1} {i === 0 ? '(Sistema Base)' : i === 1 ? '(Extração)' : i === 2 ? '(Validação)' : ''}
                          </label>
                          <textarea
                            value={settings.prompts?.[`prompt${i + 1}`] || ''}
                            onChange={(e) => updateSetting('prompts', `prompt${i + 1}`, e.target.value)}
                            placeholder={`Prompt ${i + 1} - deixe em branco se não for usar`}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <ToggleField
                      label="Processamento Sequencial"
                      value={settings.prompts?.sequential || true}
                      onChange={(value) => updateSetting('prompts', 'sequential', value)}
                      description="Executar prompts em sequência (um após o outro)"
                    />
                    <ToggleField
                      label="Validação de Saída"
                      value={settings.prompts?.validateOutput || true}
                      onChange={(value) => updateSetting('prompts', 'validateOutput', value)}
                      description="Validar saída de cada prompt"
                    />
                  </div>
                </div>
              </ExpandableSection>
            )}

            {/* Sistema */}
            <ExpandableSection title="Sistema e Performance" icon={Server}>
              <div className="space-y-3">
                <ToggleField
                  label="Salvamento Automático"
                  value={settings.system.auto_save}
                  onChange={(value) => updateSetting('system', 'auto_save', value)}
                  description="Salvar conversas automaticamente"
                  icon={Database}
                />
                <ToggleField
                  label="Cache Habilitado"
                  value={settings.system.cache_enabled}
                  onChange={(value) => updateSetting('system', 'cache_enabled', value)}
                  description="Melhorar performance com cache"
                  icon={Zap}
                />
                <ToggleField
                  label="Modo de Performance"
                  value={settings.system.performance_mode}
                  onChange={(value) => updateSetting('system', 'performance_mode', value)}
                  description="Otimizar para dispositivos mais lentos"
                  icon={Server}
                />
                {isAdmin && (
                  <>
                    <ToggleField
                      label="Modo Debug"
                      value={settings.system.debug_mode}
                      onChange={(value) => updateSetting('system', 'debug_mode', value)}
                      description="Habilitar logs detalhados para desenvolvimento"
                      icon={Key}
                    />
                    <ToggleField
                      label="Analytics"
                      value={settings.system.analytics}
                      onChange={(value) => updateSetting('system', 'analytics', value)}
                      description="Coletar dados de uso para melhorias"
                      icon={Globe}
                    />
                  </>
                )}
              </div>
            </ExpandableSection>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <RotateCcw size={16} />
                Restaurar Padrões
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                data-save-button
                disabled={!hasChanges}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Save size={16} />
                Salvar Configurações
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewSettingsModal;