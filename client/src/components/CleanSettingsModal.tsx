import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import { 
  X, Settings, User, Database, Bell, 
  Globe, Lock, Eye, EyeOff, Save, RotateCcw, 
  Key, Server, Zap, Brain, ChevronDown, ChevronRight,
  Mail, Phone, MapPin, Calendar, Camera, Edit3
} from 'lucide-react';

const ToggleField = ({ label, value, onChange, description, icon: Icon }) => (
  <div className="toggle-section">
    <div className="toggle-header">
      <div className="flex items-center gap-3 toggle-label">
        {Icon && <Icon size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />}
        <div className="min-w-0">
          <div className="font-medium text-gray-900 dark:text-gray-100">{label}</div>
          {description && <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`toggle-switch relative w-10 h-6 rounded-full transition-colors ${
          value ? 'bg-gray-600 dark:bg-gray-700' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            value ? 'translate-x-5' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  </div>
);

const CleanSettingsModal = ({ isOpen, onClose, user, globalSettings, onUpdateGlobalSettings }) => {
  const [location, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState({
    profile: {
      name: user?.username || 'Admin',
      newPassword: ''
    },
    audio: {
      transcriptionVerification: true
    },
    notifications: {
      desktop: true,
      sound: true,
      analysisComplete: true
    },
    system: {
      autoSave: true,
      cacheEnabled: true,
      debugMode: false,
      requireLogin: globalSettings?.requireLogin ?? true
    }
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsAdmin(user?.role === 'admin');
    setSettings(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        name: user?.username || 'Admin'
      }
    }));
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
    
    // Se for uma configuração global, atualiza também
    if (section === 'system' && key === 'requireLogin') {
      onUpdateGlobalSettings({ requireLogin: value });
    }
  };

  const handleSave = async () => {
    try {
      // Salvar configurações no localStorage
      localStorage.setItem('financeai-settings', JSON.stringify(settings));
      
      // Se há nova senha, atualizar no servidor
      if (settings.profile.newPassword) {
        const response = await fetch('/api/user/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ newPassword: settings.profile.newPassword })
        });
        
        if (response.ok) {
          setSettings(prev => ({ ...prev, profile: { ...prev.profile, newPassword: '' } }));
        }
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setSettings({
        profile: { name: user?.username || 'Admin', newPassword: '' },
        audio: { transcriptionVerification: true },
        notifications: { desktop: true, sound: true, analysisComplete: true },
        system: { autoSave: true, cacheEnabled: true, debugMode: false }
      });
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
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-stretch md:items-center justify-center p-0 md:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white dark:bg-gray-900 w-full max-w-md md:rounded-xl shadow-2xl flex flex-col max-h-screen md:max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
          data-modal="settings"
        >
          {/* Cabeçalho Limpo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <Settings size={24} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Configurações</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Perfil do Usuário */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User size={18} />
                Perfil do Usuário
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome
                  </label>
                  <input
                    type="text"
                    value={settings.profile.name}
                    onChange={(e) => updateSetting('profile', 'name', e.target.value)}
                    inputMode="text"
                    autoComplete="username"
                    style={{ fontSize: '16px' }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Alterar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={settings.profile.newPassword}
                      onChange={(e) => updateSetting('profile', 'newPassword', e.target.value)}
                      placeholder="Digite nova senha"
                      inputMode="text"
                      autoComplete="new-password"
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-3xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sistema de Áudio */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap size={18} />
                Sistema de Áudio
              </h3>
              
              <ToggleField
                label="Verificação de Transcrição"
                description="Permitir revisar transcrição antes de enviar"
                value={settings.audio.transcriptionVerification}
                onChange={(value) => updateSetting('audio', 'transcriptionVerification', value)}
                icon={Brain}
              />
            </div>

            {/* Notificações */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={18} />
                Notificações
              </h3>
              
              <div className="space-y-3">
                <ToggleField
                  label="Notificações Desktop"
                  description="Mostrar notificações no desktop"
                  value={settings.notifications.desktop}
                  onChange={(value) => updateSetting('notifications', 'desktop', value)}
                />
                
                <ToggleField
                  label="Reproduzir Sons"
                  description="Reproduzir sons de notificação"
                  value={settings.notifications.sound}
                  onChange={(value) => updateSetting('notifications', 'sound', value)}
                />
                
                <ToggleField
                  label="Análise Completa"
                  description="Notificar quando análise terminar"
                  value={settings.notifications.analysisComplete}
                  onChange={(value) => updateSetting('notifications', 'analysisComplete', value)}
                />
              </div>
            </div>

            {/* Sistema e Performance */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Server size={18} />
                Sistema e Performance
              </h3>
              
              <div className="space-y-3">
                <ToggleField
                  label="Salvamento Automático"
                  description="Salvar conversas automaticamente"
                  value={settings.system.autoSave}
                  onChange={(value) => updateSetting('system', 'autoSave', value)}
                />
                
                <ToggleField
                  label="Cache Habilitado"
                  description="Melhorar performance com cache"
                  value={settings.system.cacheEnabled}
                  onChange={(value) => updateSetting('system', 'cacheEnabled', value)}
                />
                
                <ToggleField
                  label="Modo Debug"
                  description="Habilitar logs detalhados"
                  value={settings.system.debugMode}
                  onChange={(value) => updateSetting('system', 'debugMode', value)}
                />
                
                <ToggleField
                  label="Login Obrigatório"
                  description="Exigir login para acessar o sistema (desative para acesso direto)"
                  value={settings.system.requireLogin}
                  onChange={(value) => updateSetting('system', 'requireLogin', value)}
                />
              </div>
            </div>
          </div>

          {/* Rodapé com Botões */}
          <div className="p-6 space-y-3">
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className={`w-full py-3 px-4 rounded-3xl flex items-center justify-center gap-2 transition-colors font-medium ${
                hasChanges
                  ? 'bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800'
                  : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save size={16} />
              Salvar
            </button>
            
            <button
              onClick={handleReset}
              className="w-full py-3 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2 rounded-3xl border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              <RotateCcw size={16} />
              Restaurar Padrões
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CleanSettingsModal;