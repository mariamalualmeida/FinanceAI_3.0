import OpenAI from 'openai';
import { MIG_AGENT_PROMPTS, getMigPrompt, processMigPrompt } from '../prompts/mig-agent-prompts';
import { FinancialConsultant } from '../consultancy/financial-consultant';
import { SmartGoalsEngine } from '../consultancy/smart-goals-engine';

export interface LLMProvider {
  name: string;
  client: any;
  generateResponse: (prompt: string, context?: string) => Promise<string>;
  isHealthy: () => Promise<boolean>;
}

export interface LLMConfig {
  id: number;
  name: string;
  provider: string;
  apiKey: string;
  model: string;
  isEnabled: boolean;
  isPrimary: boolean;
  isBackup: boolean;
  maxTokens: number;
  temperature: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface MultiLlmStrategy {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemPrompts {
  id: number;
  category: string;
  name: string;
  prompt1: string | null;
  prompt2: string | null;
  prompt3: string | null;
  prompt4: string | null;
  prompt5: string | null;
  prompt6: string | null;
  prompt7: string | null;
  prompt8: string | null;
  prompt9: string | null;
  prompt10: string | null;
  prompt11: string | null;
  prompt12: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class MultiLLMOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();
  private strategy: MultiLlmStrategy | null = null;
  private prompts: SystemPrompts | null = null;
  private storage: any = null;

  constructor(storage?: any) {
    this.storage = storage;
  }

  async initialize() {
    console.log('OpenAI provider disabled due to permissions issues. Will use other available APIs.');

    // Load database configurations if storage is available
    if (this.storage) {
      await this.loadDatabaseConfigurations();
    }
  }

  private async loadDatabaseConfigurations() {
    try {
      // Load LLM configurations from database
      const configs = await this.storage.getEnabledLlmConfigs();
      for (const config of configs) {
        await this.initializeProvider(config);
      }

      // Load active strategy
      this.strategy = await this.storage.getActiveMultiLlmStrategy();
      
      // Load active prompts
      const activePrompts = await this.storage.getActiveSystemPrompts();
      if (activePrompts.length > 0) {
        this.prompts = activePrompts[0];
      }
    } catch (error) {
      console.error('Error loading database configurations:', error);
    }
  }

  private async initializeProvider(config: LLMConfig) {
    try {
      let provider: LLMProvider;

      switch (config.provider.toLowerCase()) {
        case 'openai':
          const openaiClient = new OpenAI({ apiKey: config.apiKey });
          provider = {
            name: config.name,
            client: openaiClient,
            generateResponse: async (prompt: string, context?: string) => {
              const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
              
              const response = await openaiClient.chat.completions.create({
                model: config.model,
                messages: [{ role: 'user', content: fullPrompt }],
                max_tokens: config.maxTokens,
                temperature: config.temperature
              });

              return response.choices[0].message.content || '';
            },
            isHealthy: async () => {
              try {
                await openaiClient.chat.completions.create({
                  model: config.model,
                  messages: [{ role: 'user', content: 'test' }],
                  max_tokens: 5
                });
                return true;
              } catch {
                return false;
              }
            }
          };
          break;

        case 'anthropic':
          // Implement Anthropic provider when needed
          console.warn('Anthropic provider not implemented yet');
          return;

        case 'google':
          // Implement Google provider when needed
          console.warn('Google provider not implemented yet');
          return;

        case 'xai':
          // xAI using OpenAI-compatible SDK
          const xaiClient = new OpenAI({
            baseURL: 'https://api.x.ai/v1',
            apiKey: config.apiKey
          });
          
          provider = {
            name: config.name,
            client: xaiClient,
            generateResponse: async (prompt: string, context?: string) => {
              const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
              
              const response = await xaiClient.chat.completions.create({
                model: config.model,
                messages: [{ role: 'user', content: fullPrompt }],
                max_tokens: config.maxTokens,
                temperature: config.temperature
              });

              return response.choices[0].message.content || '';
            },
            isHealthy: async () => {
              try {
                await xaiClient.chat.completions.create({
                  model: config.model,
                  messages: [{ role: 'user', content: 'test' }],
                  max_tokens: 5
                });
                return true;
              } catch {
                return false;
              }
            }
          };
          break;

        default:
          console.warn(`Unknown LLM provider: ${config.provider}`);
          return;
      }

      this.providers.set(config.name, provider);
      console.log(`LLM Provider ${config.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize LLM provider ${config.name}:`, error);
      
      // Disable provider in database if initialization fails
      if (this.storage) {
        await this.disableProvider(config.id);
      }
    }
  }

  private async disableProvider(configId: number) {
    try {
      await this.storage.updateLlmConfig(configId, { isEnabled: false });
      console.log(`Provider ${configId} disabled due to initialization failure`);
    } catch (error) {
      console.error(`Failed to disable provider ${configId}:`, error);
    }
  }

  async processMessage(input: string, options: { userId?: string, strategy?: string } = {}): Promise<string> {
    try {
      // Initialize if not done yet
      if (this.providers.size === 0) {
        await this.initialize();
      }

      // Use provided strategy or default to balanced
      const strategyMode = options.strategy || 'balanced';
      
      // Simple strategy mapping for now
      switch (strategyMode) {
        case 'economic':
          return await this.economicMode(input);
        case 'premium':
          return await this.premiumMode(input);
        case 'balanced':
        default:
          return await this.balancedMode(input);
      }
    } catch (error) {
      console.error('Error in multi-LLM processing:', error);
      throw error;
    }
  }

  private async economicMode(input: string, context?: string): Promise<string> {
    // Use primary provider only
    const primaryProvider = Array.from(this.providers.values())[0];
    
    if (!primaryProvider) {
      throw new Error('No LLM providers available. Please configure at least one API key.');
    }

    try {
      const response = await primaryProvider.generateResponse(input, context);
      return response;
    } catch (error) {
      console.error(`Provider ${primaryProvider.name} failed:`, error);
      
      // Try backup providers
      const backupProviders = Array.from(this.providers.values()).slice(1);
      for (const provider of backupProviders) {
        try {
          console.log(`Trying backup provider: ${provider.name}`);
          const response = await provider.generateResponse(input, context);
          return response;
        } catch (backupError) {
          console.error(`Backup provider ${provider.name} failed:`, backupError);
        }
      }
      
      throw new Error('All LLM providers failed. Please check your API keys and try again.');
    }
  }

  private async balancedMode(input: string, context?: string): Promise<string> {
    // For now, use economic mode
    // In future, implement load balancing between providers
    return await this.economicMode(input, context);
  }

  private async premiumMode(input: string, context?: string): Promise<string> {
    // For now, use economic mode
    // In future, implement parallel processing and consensus
    return await this.economicMode(input, context);
  }

  private async useBackupLLM(input: string, context?: string): Promise<string> {
    const backupProviders = Array.from(this.providers.values()).slice(1);
    
    for (const provider of backupProviders) {
      try {
        console.log(`Using backup provider: ${provider.name}`);
        const response = await provider.generateResponse(input, context);
        return response;
      } catch (error) {
        console.error(`Backup provider ${provider.name} failed:`, error);
      }
    }
    
    throw new Error('All backup providers failed');
  }

  private routeBySubject(input: string): LLMProvider | null {
    // Simple subject-based routing
    const financialKeywords = ['financeiro', 'crédito', 'transação', 'banco', 'dinheiro'];
    const isFinancial = financialKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );

    if (isFinancial) {
      // Prefer OpenAI for financial analysis
      return this.providers.get('openai') || null;
    }

    return null; // Use default routing
  }

  private async validateResponse(response: string, originalInput: string, context?: string): Promise<string> {
    // Basic validation - ensure response is not empty and reasonable length
    if (!response || response.trim().length === 0) {
      throw new Error('Empty response from LLM');
    }

    if (response.length > 10000) {
      console.warn('Response is very long, truncating...');
      return response.substring(0, 10000) + '...';
    }

    return response;
  }

  private buildPrompt(input: string): string {
    // Primeiro tenta usar prompts do Mig
    const migPrompt = this.buildMigPrompt(input);
    if (migPrompt !== input) {
      return migPrompt;
    }

    // Fallback para prompts do sistema
    if (!this.prompts) {
      return input;
    }

    // Build chained prompt from system prompts
    const promptChain = [
      this.prompts.prompt1,
      this.prompts.prompt2,
      this.prompts.prompt3,
      this.prompts.prompt4,
      this.prompts.prompt5,
      this.prompts.prompt6,
      this.prompts.prompt7,
      this.prompts.prompt8,
      this.prompts.prompt9,
      this.prompts.prompt10,
      this.prompts.prompt11,
      this.prompts.prompt12
    ].filter(Boolean);

    if (promptChain.length === 0) {
      return input;
    }

    return `${promptChain.join('\n\n')}\n\nUser Input: ${input}`;
  }

  private buildMigPrompt(input: string): string {
    // Detecta o tipo de análise baseado no input
    const analysisType = this.detectAnalysisType(input);
    
    if (analysisType) {
      const migPrompt = getMigPrompt(analysisType);
      if (migPrompt) {
        const personalityPrompt = getMigPrompt('mig-personality');
        const basePrompt = personalityPrompt ? personalityPrompt.prompt : '';
        
        return `${basePrompt}\n\n${migPrompt.prompt}\n\nUser Input: ${input}`;
      }
    }

    return input;
  }

  private detectAnalysisType(input: string): string | null {
    const inputLower = input.toLowerCase();
    
    // Detecção baseada em palavras-chave
    if (inputLower.includes('crédito') || inputLower.includes('score') || inputLower.includes('risco')) {
      return 'mig-credit-analysis';
    }
    
    if (inputLower.includes('consultoria') || inputLower.includes('plano') || inputLower.includes('financeiro')) {
      return 'mig-financial-consultancy';
    }
    
    if (inputLower.includes('meta') || inputLower.includes('objetivo') || inputLower.includes('ação')) {
      return 'mig-action-plan';
    }
    
    if (inputLower.includes('relatório') || inputLower.includes('análise') || inputLower.includes('documento')) {
      return 'mig-reporting';
    }
    
    return null;
  }

  private getLastUsedProvider(): string {
    // Simple implementation - return first available provider
    const firstProvider = Array.from(this.providers.keys())[0];
    return firstProvider || 'none';
  }

  async processChainedPrompts(input: string, context?: string): Promise<string> {
    // Use system prompts if available
    const enhancedInput = this.buildPrompt(input);
    return await this.processMessage(enhancedInput, {});
  }

  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  async getProviderHealth(): Promise<Record<string, boolean>> {
    const health: Record<string, boolean> = {};
    
    for (const [name, provider] of this.providers) {
      try {
        health[name] = await provider.isHealthy();
      } catch {
        health[name] = false;
      }
    }
    
    return health;
  }
}

export default MultiLLMOrchestrator;