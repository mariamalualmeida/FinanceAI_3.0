export interface VersionConfig {
  name: string;
  version: string;
  features: {
    fullLLMOrchestration: boolean;
    adminPanel: boolean;
    knowledgeBase: boolean;
    offlineMode: boolean;
    nativeIntegration: boolean;
    fileUpload: boolean;
    financialAnalysis: boolean;
    multiUser: boolean;
    databaseSync: boolean;
  };
  storage: {
    type: 'postgresql' | 'indexeddb' | 'sqlite';
    connection?: string;
    local: boolean;
  };
  api: {
    baseUrl: string;
    endpoints: string[];
    rateLimit?: number;
  };
  deployment: {
    platform: 'server' | 'pwa' | 'android';
    buildCommand: string;
    environment: string[];
  };
}

export const VERSION_CONFIGS: Record<string, VersionConfig> = {
  'server-web': {
    name: 'FinanceAI Server Web',
    version: '2.8.0',
    features: {
      fullLLMOrchestration: true,
      adminPanel: true,
      knowledgeBase: true,
      offlineMode: false,
      nativeIntegration: false,
      fileUpload: true,
      financialAnalysis: true,
      multiUser: true,
      databaseSync: true
    },
    storage: {
      type: 'postgresql',
      connection: process.env.DATABASE_URL || '',
      local: false
    },
    api: {
      baseUrl: 'http://localhost:5000',
      endpoints: [
        '/api/auth',
        '/api/conversations',
        '/api/messages',
        '/api/upload-financial-document',
        '/api/admin',
        '/api/knowledge-base',
        '/api/llm-config',
        '/api/system-config'
      ]
    },
    deployment: {
      platform: 'server',
      buildCommand: 'npm run build',
      environment: [
        'DATABASE_URL',
        'SESSION_SECRET',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'XAI_API_KEY'
      ]
    }
  },

  'pwa': {
    name: 'FinanceAI PWA',
    version: '2.8.0',
    features: {
      fullLLMOrchestration: false,
      adminPanel: false,
      knowledgeBase: false,
      offlineMode: true,
      nativeIntegration: false,
      fileUpload: true,
      financialAnalysis: true,
      multiUser: false,
      databaseSync: true
    },
    storage: {
      type: 'indexeddb',
      local: true
    },
    api: {
      baseUrl: 'http://localhost:5000',
      endpoints: [
        '/api/lite/auth',
        '/api/lite/chat',
        '/api/lite/upload',
        '/api/lite/conversations',
        '/api/lite/sync',
        '/api/lite/health'
      ],
      rateLimit: 10 // requests per minute
    },
    deployment: {
      platform: 'pwa',
      buildCommand: 'npm run build:pwa',
      environment: [
        'OPENAI_API_KEY'
      ]
    }
  },

  'android': {
    name: 'FinanceAI Android',
    version: '2.8.0',
    features: {
      fullLLMOrchestration: false,
      adminPanel: false,
      knowledgeBase: false,
      offlineMode: true,
      nativeIntegration: true,
      fileUpload: true,
      financialAnalysis: true,
      multiUser: false,
      databaseSync: true
    },
    storage: {
      type: 'sqlite',
      local: true
    },
    api: {
      baseUrl: 'http://localhost:5000',
      endpoints: [
        '/api/lite/auth',
        '/api/lite/chat',
        '/api/lite/upload',
        '/api/lite/conversations',
        '/api/lite/sync'
      ]
    },
    deployment: {
      platform: 'android',
      buildCommand: './gradlew assembleRelease',
      environment: [
        'OPENAI_API_KEY'
      ]
    }
  }
};

export function getCurrentVersionConfig(): VersionConfig {
  // Detect current environment
  if (typeof window === 'undefined') {
    // Server environment
    return VERSION_CONFIGS['server-web'];
  }
  
  if (window.navigator?.userAgent?.includes('FinanceAI-Android')) {
    // Android app
    return VERSION_CONFIGS['android'];
  }
  
  if (window.matchMedia('(display-mode: standalone)').matches) {
    // PWA
    return VERSION_CONFIGS['pwa'];
  }
  
  // Default to server web
  return VERSION_CONFIGS['server-web'];
}

export function isFeatureEnabled(feature: keyof VersionConfig['features']): boolean {
  const config = getCurrentVersionConfig();
  return config.features[feature];
}

export function getApiEndpoint(endpoint: string): string {
  const config = getCurrentVersionConfig();
  const baseUrl = config.api.baseUrl;
  
  // Check if endpoint is supported in current version
  const isSupported = config.api.endpoints.some(e => endpoint.startsWith(e.split('/').slice(0, -1).join('/')));
  
  if (!isSupported) {
    console.warn(`Endpoint ${endpoint} not supported in ${config.name}`);
    // Fallback to lite endpoint for PWA/Android
    if (config.platform === 'pwa' || config.platform === 'android') {
      return `${baseUrl}/api/lite${endpoint.replace('/api', '')}`;
    }
  }
  
  return `${baseUrl}${endpoint}`;
}

export class VersionAdapter {
  private config: VersionConfig;

  constructor() {
    this.config = getCurrentVersionConfig();
  }

  async makeApiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = getApiEndpoint(endpoint);
    
    // Add version-specific headers
    const headers = {
      'Content-Type': 'application/json',
      'X-Client-Version': this.config.version,
      'X-Client-Platform': this.config.deployment.platform,
      ...options.headers
    };

    // Apply rate limiting for PWA
    if (this.config.deployment.platform === 'pwa' && this.config.api.rateLimit) {
      await this.applyRateLimit(this.config.api.rateLimit);
    }

    return fetch(url, {
      ...options,
      headers
    });
  }

  private async applyRateLimit(limit: number): Promise<void> {
    const key = `rateLimit_${Date.now().toString().slice(0, -4)}`; // minute-based key
    const current = parseInt(localStorage.getItem(key) || '0');
    
    if (current >= limit) {
      throw new Error('Rate limit exceeded. Please wait a moment.');
    }
    
    localStorage.setItem(key, (current + 1).toString());
    
    // Cleanup old keys
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith('rateLimit_') && storageKey !== key) {
        localStorage.removeItem(storageKey);
      }
    }
  }

  async uploadFile(file: File, conversationId: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('conversationId', conversationId);

    const endpoint = this.config.deployment.platform === 'server' 
      ? '/api/upload-financial-document'
      : '/api/lite/upload';

    return this.makeApiRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set multipart headers
    });
  }

  async sendMessage(message: string, conversationId?: string): Promise<any> {
    const endpoint = this.config.deployment.platform === 'server'
      ? '/api/chat'
      : '/api/lite/chat';

    return this.makeApiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({ message, conversationId })
    });
  }

  async getConversations(): Promise<any> {
    const endpoint = this.config.deployment.platform === 'server'
      ? '/api/conversations'
      : '/api/lite/conversations';

    return this.makeApiRequest(endpoint);
  }

  async sync(): Promise<any> {
    if (!this.config.features.databaseSync) {
      console.log('Sync not supported in this version');
      return { success: true, message: 'Sync not needed' };
    }

    if (this.config.deployment.platform === 'server') {
      // Server version doesn't need sync
      return { success: true, message: 'Already synced' };
    }

    // PWA/Android sync
    const data = await this.collectLocalData();
    return this.makeApiRequest('/api/lite/sync', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  private async collectLocalData(): Promise<any> {
    // This would collect data from IndexedDB/SQLite for sync
    return {
      conversations: [],
      messages: [],
      analyses: []
    };
  }

  getHealthInfo(): any {
    return {
      version: this.config.version,
      platform: this.config.deployment.platform,
      features: this.config.features,
      online: navigator.onLine
    };
  }
}

export default VersionAdapter;