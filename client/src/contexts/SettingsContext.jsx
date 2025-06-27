import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

const defaultSettings = {
  theme: 'light',
  interface: 'chatgpt',
  userName: '',
  // Profile settings
  profile: {
    name: '',
    email: '',
    phone: '',
    location: 'Brasil',
    bio: 'Especialista em análise financeira',
    language: 'pt-BR'
  },
  // Interface settings
  interfaceSettings: {
    compact_mode: false,
    show_sidebar: true,
    font_size: 'medium',
    animation_speed: 'normal',
    auto_scroll: true
  },
  // API settings (admin only)
  apis: {
    openai_key: '',
    anthropic_key: '',
    google_key: '',
    whisper_enabled: true,
    default_model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 2048
  },
  // Notifications
  notifications: {
    desktop: true,
    sound: true,
    email: false,
    analysis_complete: true,
    new_features: true,
    security_alerts: true
  },
  // Security
  security: {
    two_factor: false,
    session_timeout: 30,
    auto_logout: true,
    data_retention: 90,
    encryption: true
  },
  // System
  system: {
    auto_save: true,
    cache_enabled: true,
    performance_mode: false,
    debug_mode: false,
    analytics: true
  }
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('financeai-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setSettings(prev => ({ ...prev, ...parsedSettings }));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

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

  const updateTheme = (theme) => {
    setSettings(prev => ({ ...prev, theme }));
    document.documentElement.className = theme === 'dark' ? 'dark' : '';
    setHasChanges(true);
  };

  const updateInterface = (interfaceType) => {
    setSettings(prev => ({ ...prev, interface: interfaceType }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    localStorage.setItem('financeai-settings', JSON.stringify(settings));
    setHasChanges(false);
    return true;
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('financeai-settings');
    setHasChanges(true);
  };

  const value = {
    settings,
    hasChanges,
    updateSetting,
    updateTheme,
    updateInterface,
    saveSettings,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};