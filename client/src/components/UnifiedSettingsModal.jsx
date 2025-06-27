import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
// import { useSettings } from '../contexts/SettingsContext';
import { 
  X, Settings, User, Shield, Database, Bell, Palette, 
  Globe, Lock, Eye, EyeOff, Save, RotateCcw, 
  Key, Server, Zap, Brain, ChevronDown, ChevronRight,
  Mail, Phone, MapPin, Calendar, Camera, Edit3
} from 'lucide-react';

const ToggleField = ({ label, value, onChange, description, icon: Icon }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={16} className="text-gray-500" />}
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
        {description && <div className="text-sm text-gray-500">{description}</div>}
      </div>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative w-10 h-6 rounded-full transition-colors ${
        value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          value ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

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
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white dark:bg-gray-900">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const UnifiedSettingsModal = ({ isOpen, onClose, currentTheme, onThemeChange, user }) => {
  const [location, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({
    theme: currentTheme || 'light',
    interface: 'chatgpt',
    profile: {
      name: user?.username || '',
      email: user?.email || ''
    },
    interfaceSettings: {
      compact_mode: false,
      show_sidebar: true,
      auto_scroll: true
    },
    notifications: {
      desktop: true,
      sound: true,
      analysis_complete: true
    },
    system: {
      auto_save: true,
      cache_enabled: true,
      debug_mode: false
    }
  });
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
  }, [user]);

  const handleSave = () => {
    saveSettings();
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      resetSettings();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-stretch md:items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-7xl h-[100dvh] md:max-h-[95vh] md:h-auto overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Configurações
              </h2>
              {isAdmin && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                  Admin
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      setLocation('/admin');
                    }, 300);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
                >
                  <Shield size={18} />
                  <span className="hidden sm:inline">Painel Admin</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content - Split Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column - Quick Settings */}
            <div className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Configurações Rápidas</h3>
              
              {/* Tema */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Palette size={16} className="text-blue-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Tema</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateTheme('light')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-6 h-6 bg-white border border-gray-300 rounded mx-auto mb-1"></div>
                    <span className="text-xs font-medium">Claro</span>
                  </button>
                  <button
                    onClick={() => updateTheme('dark')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      settings.theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-6 h-6 bg-gray-800 rounded mx-auto mb-1"></div>
                    <span className="text-xs font-medium">Escuro</span>
                  </button>
                </div>
              </div>

              {/* Interface */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Database size={16} className="text-green-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Interface</span>
                </div>
                <div className="space-y-2">
                  {[
                    { value: 'chatgpt', label: 'ChatGPT', icon: '🤖' },
                    { value: 'gemini', label: 'Gemini', icon: '💎' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateInterface(option.value)}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        settings.interface === option.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-sm font-medium">{option.icon} {option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Configurações Rápidas */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Zap size={16} className="text-yellow-600" />
                  <span className="font-medium text-gray-900 dark:text-gray-100">Rápidas</span>
                </div>
                <div className="space-y-3">
                  <ToggleField
                    label="Modo Compacto"
                    value={settings.interfaceSettings?.compact_mode || false}
                    onChange={(value) => updateSetting('interfaceSettings', 'compact_mode', value)}
                    description="Interface mais compacta"
                  />
                  <ToggleField
                    label="Mostrar Sidebar"
                    value={settings.interfaceSettings?.show_sidebar || true}
                    onChange={(value) => updateSetting('interfaceSettings', 'show_sidebar', value)}
                    description="Exibir sidebar de conversas"
                  />
                  <ToggleField
                    label="Rolagem Automática"
                    value={settings.interfaceSettings?.auto_scroll || true}
                    onChange={(value) => updateSetting('interfaceSettings', 'auto_scroll', value)}
                    description="Rolar para novas mensagens"
                  />
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Settings */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
              
              {/* Perfil do Usuário */}
              <ExpandableSection title="Perfil do Usuário" icon={User} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nome
                    </label>
                    <input
                      type="text"
                      value={settings.profile?.name || user?.username || ''}
                      onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={settings.profile?.email || user?.email || ''}
                      onChange={(e) => updateSetting('profile', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </ExpandableSection>

              {/* Notificações */}
              <ExpandableSection title="Notificações" icon={Bell}>
                <div className="space-y-3">
                  <ToggleField
                    label="Notificações Desktop"
                    value={settings.notifications?.desktop || true}
                    onChange={(value) => updateSetting('notifications', 'desktop', value)}
                    description="Mostrar notificações no desktop"
                    icon={Bell}
                  />
                  <ToggleField
                    label="Sons"
                    value={settings.notifications?.sound || true}
                    onChange={(value) => updateSetting('notifications', 'sound', value)}
                    description="Reproduzir sons de notificação"
                    icon={Globe}
                  />
                  <ToggleField
                    label="Análise Completa"
                    value={settings.notifications?.analysis_complete || true}
                    onChange={(value) => updateSetting('notifications', 'analysis_complete', value)}
                    description="Notificar quando análise terminar"
                    icon={Brain}
                  />
                </div>
              </ExpandableSection>

              {/* Sistema */}
              <ExpandableSection title="Sistema e Performance" icon={Server}>
                <div className="space-y-3">
                  <ToggleField
                    label="Salvamento Automático"
                    value={settings.system?.auto_save || true}
                    onChange={(value) => updateSetting('system', 'auto_save', value)}
                    description="Salvar conversas automaticamente"
                    icon={Database}
                  />
                  <ToggleField
                    label="Cache Habilitado"
                    value={settings.system?.cache_enabled || true}
                    onChange={(value) => updateSetting('system', 'cache_enabled', value)}
                    description="Melhorar performance com cache"
                    icon={Zap}
                  />
                  {isAdmin && (
                    <ToggleField
                      label="Modo Debug"
                      value={settings.system?.debug_mode || false}
                      onChange={(value) => updateSetting('system', 'debug_mode', value)}
                      description="Habilitar logs detalhados"
                      icon={Key}
                    />
                  )}
                </div>
              </ExpandableSection>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-center sm:justify-start">
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
              >
                <RotateCcw size={16} />
                Restaurar Padrões
              </button>
            </div>
            
            <div className="flex items-center gap-3 justify-center sm:justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-4 md:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm"
              >
                <Save size={16} />
                <span className="hidden sm:inline">Salvar Configurações</span>
                <span className="sm:hidden">Salvar</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UnifiedSettingsModal;