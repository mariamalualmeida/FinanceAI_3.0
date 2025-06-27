// Sistema de migração e limpeza de configurações
const CURRENT_CONFIG_VERSION = '2.1.0';
const CONFIG_KEY = 'financeai-settings';

interface LegacyConfig {
  theme?: string;
  interface?: string;
  version?: string;
  [key: string]: any;
}

interface CurrentConfig {
  version: string;
  theme: 'light' | 'dark';
  interface: 'gemini';
  timestamp: number;
}

export const cleanLegacyConfigs = (): void => {
  // Lista de chaves antigas que podem estar no localStorage
  const legacyKeys = [
    'financeai-config',
    'financeai-theme',
    'financeai-interface',
    'financeai-user',
    'gemini-settings',
    'chat-settings'
  ];

  legacyKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
};

export const migrateConfig = (): CurrentConfig => {
  const stored = localStorage.getItem(CONFIG_KEY);
  
  // Se não há configuração ou é muito antiga, criar nova
  if (!stored) {
    const newConfig: CurrentConfig = {
      version: CURRENT_CONFIG_VERSION,
      theme: 'light',
      interface: 'gemini',
      timestamp: Date.now()
    };
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    return newConfig;
  }
  
  try {
    const parsed: LegacyConfig = JSON.parse(stored);
    
    // Se versão é antiga ou não existe, migrar
    if (!parsed.version || parsed.version !== CURRENT_CONFIG_VERSION) {
      const migratedConfig: CurrentConfig = {
        version: CURRENT_CONFIG_VERSION,
        theme: (parsed.theme === 'dark') ? 'dark' : 'light',
        interface: 'gemini',
        timestamp: Date.now()
      };
      
      localStorage.setItem(CONFIG_KEY, JSON.stringify(migratedConfig));
      return migratedConfig;
    }
    
    return parsed as CurrentConfig;
  } catch {
    // Se erro no parse, criar configuração limpa
    const newConfig: CurrentConfig = {
      version: CURRENT_CONFIG_VERSION,
      theme: 'light',
      interface: 'gemini',
      timestamp: Date.now()
    };
    
    localStorage.setItem(CONFIG_KEY, JSON.stringify(newConfig));
    return newConfig;
  }
};

export const initializeCleanApp = (): CurrentConfig => {
  // Limpar todas as configurações antigas
  cleanLegacyConfigs();
  
  // Migrar ou criar configuração atual
  return migrateConfig();
};