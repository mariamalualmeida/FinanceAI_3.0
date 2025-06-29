import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { storage } from './storage';
import type { LlmConfig, MultiLlmStrategy, SystemPrompts } from '@shared/schema';

/*
Follow these instructions when using this blueprint:
- Note that the newest OpenAI model is "gpt-4o", not "gpt-4". gpt-4o was released after your knowledge cutoff. Always prefer using gpt-4o as it is the latest model.
- The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229".
- Note that the newest Gemini model series is "gemini-2.5-flash" or "gemini-2.5-pro"
*/

interface LLMProvider {
  name: string;
  client: any;
  generateResponse: (prompt: string, context?: string) => Promise<string>;
  isHealthy: () => Promise<boolean>;
}

class MultiLLMOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();
  private strategy: MultiLlmStrategy | null = null;
  private prompts: SystemPrompts | null = null;

  async initialize() {
    try {
      console.log('Initializing Multi-LLM Orchestrator with API keys...');
      
      // Prioridade 1: Gemini (principal)
      if (process.env.GEMINI_API_KEY) {
        console.log('Initializing Gemini provider as PRIMARY');
        
        const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const provider: LLMProvider = {
          name: 'gemini',
          client: gemini,
          generateResponse: async (prompt: string, context?: string) => {
            const fullPrompt = context ? `${prompt}\n\nContexto: ${context}` : prompt;
            
            const response = await gemini.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: fullPrompt
            });
            
            return response.text || '';
          },
          isHealthy: async () => {
            try {
              const testResponse = await gemini.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Test'
              });
              return !!testResponse.text;
            } catch {
              return false;
            }
          }
        };
        
        this.providers.set('gemini', provider);
        console.log('✅ Gemini provider initialized as PRIMARY');
      }

      // Prioridade 2: Claude/Anthropic (backup)
      if (process.env.ANTHROPIC_API_KEY) {
        console.log('Initializing Anthropic provider as BACKUP');
        
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const provider: LLMProvider = {
          name: 'anthropic',
          client: anthropic,
          generateResponse: async (prompt: string, context?: string) => {
            const messages = [
              { role: 'user', content: context ? `${prompt}\n\nContexto: ${context}` : prompt }
            ];
            
            const response = await anthropic.messages.create({
              model: 'claude-sonnet-4-20250514',
              messages: messages as any,
              max_tokens: 4000
            });
            
            return response.content[0].type === 'text' ? response.content[0].text : '';
          },
          isHealthy: async () => {
            try {
              const testResponse = await anthropic.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 5,
                messages: [{ role: 'user', content: 'Test' }]
              });
              return !!testResponse.content[0];
            } catch {
              return false;
            }
          }
        };
        
        this.providers.set('anthropic', provider);
        console.log('✅ Anthropic provider initialized as BACKUP');
      }

      // Prioridade 3: OpenAI (se disponível)
      if (process.env.OPENAI_API_KEY) {
        console.log('Initializing OpenAI provider as TERTIARY');
        
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const provider: LLMProvider = {
          name: 'openai',
          client: openai,
          generateResponse: async (prompt: string, context?: string) => {
            const messages = [
              { role: 'system', content: prompt },
              { role: 'user', content: context || 'Analise os dados fornecidos.' }
            ];
            
            const response = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: messages as any,
              temperature: 0.7,
              max_tokens: 4000
            });
            
            return response.choices[0].message.content || '';
          },
          isHealthy: async () => {
            try {
              const testResponse = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 5
              });
              return !!testResponse.choices[0];
            } catch {
              return false;
            }
          }
        };
        
        this.providers.set('openai', provider);
        console.log('✅ OpenAI provider initialized as TERTIARY');
      }

      console.log(`Multi-LLM Orchestrator initialized with ${this.providers.size} providers`);
      console.log(`Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
      
    } catch (error) {
      console.error('Error initializing LLM orchestrator:', error);
    }
  }

  private async disableProvider(configId: number) {
    try {
      await storage.updateLlmConfig(configId, { isEnabled: false });
      console.log(`Provider ${configId} disabled due to invalid API key`);
    } catch (error) {
      console.error(`Failed to disable provider ${configId}:`, error);
    }
  }

  private async validateApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      switch (provider) {
        case 'openai':
          const openaiClient = new OpenAI({ apiKey });
          const testResponse = await openaiClient.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
          });
          return !!testResponse.choices[0];

        case 'anthropic':
          const anthropicClient = new Anthropic({ apiKey });
          const anthropicResponse = await anthropicClient.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 5,
            messages: [{ role: 'user', content: 'Test' }]
          });
          return !!anthropicResponse.content[0];

        case 'google':
          // TODO: Implementar Google Generative AI após verificar a API correta
          return false;

        case 'xai':
          const xaiClient = new OpenAI({ 
            baseURL: "https://api.x.ai/v1", 
            apiKey 
          });
          const xaiResponse = await xaiClient.chat.completions.create({
            model: 'grok-2-1212',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 5
          });
          return !!xaiResponse.choices[0];

        default:
          return false;
      }
    } catch (error: any) {
      console.log(`API key validation failed for ${provider}:`, error.message || 'Unknown error');
      return false;
    }
  }

  private async initializeProvider(config: LlmConfig) {
    try {
      let provider: LLMProvider;

      switch (config.name) {
        case 'openai':
          console.log(`Skipping OpenAI provider - temporarily disabled due to permissions issue`);
          await this.disableProvider(config.id);
          return;

        case 'anthropic':
          const anthropicKey = config.apiKey || process.env.ANTHROPIC_API_KEY;
          if (!anthropicKey) {
            console.log(`Skipping Anthropic provider - no API key available`);
            return;
          }
          
          const anthropic = new Anthropic({ apiKey: anthropicKey });
          provider = {
            name: 'anthropic',
            client: anthropic,
            generateResponse: async (prompt: string, context?: string) => {
              const response = await anthropic.messages.create({
                model: config.model,
                system: prompt,
                messages: [{ role: 'user', content: context || 'Analise os dados fornecidos.' }],
                temperature: parseFloat(config.temperature?.toString() || '0.7'),
                max_tokens: config.maxTokens || 4000
              });
              
              const textContent = response.content.find(c => c.type === 'text');
              return textContent ? textContent.text : '';
            },
            isHealthy: async () => {
              try {
                await anthropic.messages.create({
                  model: config.model,
                  messages: [{ role: 'user', content: 'test' }],
                  max_tokens: 10
                });
                return true;
              } catch {
                return false;
              }
            }
          };
          break;

        case 'google':
          const googleKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;
          if (!googleKey) {
            console.log(`Skipping Google provider - no API key available`);
            return;
          }
          
          // TODO: Implementar Google Generative AI após resolução da biblioteca
          provider = {
            name: 'google',
            client: null,
            generateResponse: async (prompt: string, context?: string) => {
              throw new Error('Google provider temporarily disabled');
            },
            isHealthy: async () => false
          };
          break;

        case 'xai':
          const xaiKey = config.apiKey || process.env.XAI_API_KEY;
          if (!xaiKey) {
            console.log(`Skipping xAI provider - no API key available`);
            return;
          }
          
          const xai = new OpenAI({ 
            baseURL: "https://api.x.ai/v1",
            apiKey: xaiKey
          });
          provider = {
            name: 'xai',
            client: xai,
            generateResponse: async (prompt: string, context?: string) => {
              const messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: context || 'Analise os dados fornecidos.' }
              ];
              
              const response = await xai.chat.completions.create({
                model: config.model || 'grok-2-1212',
                messages: messages as any,
                temperature: parseFloat(config.temperature?.toString() || '0.7'),
                max_tokens: config.maxTokens || 4000
              });
              
              return response.choices[0].message.content || '';
            },
            isHealthy: async () => {
              try {
                await xai.models.list();
                return true;
              } catch {
                return false;
              }
            }
          };
          break;

        default:
          console.warn(`Unknown LLM provider: ${config.name}`);
          return;
      }

      this.providers.set(config.name, provider);
      console.log(`LLM Provider ${config.name} initialized successfully`);
    } catch (error) {
      console.error(`Failed to initialize LLM provider ${config.name}:`, error);
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
          return this.economicMode(input);
        case 'premium':
          return this.premiumMode(input);
        case 'balanced':
        default:
          return this.balancedMode(input);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      return 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.';
    }
  }

  async processRequest(input: string, context?: string): Promise<string> {
    if (!this.strategy) {
      throw new Error('No strategy configured');
    }

    switch (this.strategy.mode) {
      case 'economic':
        return this.economicMode(input, context);
      case 'balanced':
        return this.balancedMode(input, context);
      case 'premium':
        return this.premiumMode(input, context);
      default:
        return this.economicMode(input, context);
    }
  }

  private async economicMode(input: string, context?: string): Promise<string> {
    // Modo econômico: usar qualquer provedor disponível
    const availableProviders = Array.from(this.providers.values());
    
    if (availableProviders.length === 0) {
      throw new Error('No LLM providers available. Please configure at least one API key.');
    }

    // Usar apenas APIs funcionais (OpenAI temporariamente desabilitada por problemas de permissão)
    const providerPriority = ['google', 'anthropic', 'xai'];
    
    for (const providerName of providerPriority) {
      const provider = this.providers.get(providerName);
      if (provider) {
        try {
          const prompt = this.buildPrompt(input);
          return await provider.generateResponse(prompt, context || undefined);
        } catch (error) {
          console.warn(`Provider ${providerName} failed, trying next:`, error);
          continue;
        }
      }
    }
    
    // Se nenhum provedor prioritário funcionou, tente qualquer um disponível
    for (const provider of availableProviders) {
      try {
        const prompt = this.buildPrompt(input);
        return await provider.generateResponse(prompt, context || undefined);
      } catch (error) {
        console.warn(`Provider ${provider.name} failed:`, error);
        continue;
      }
    }
    
    throw new Error('All LLM providers failed. Please check your API keys and try again.');
  }

  private async balancedMode(input: string, context?: string): Promise<string> {
    // Modo balanceado: Roteamento inteligente + backup
    if (this.strategy?.enableSubjectRouting) {
      const routedProvider = this.routeBySubject(input);
      if (routedProvider) {
        try {
          const prompt = this.buildPrompt(input);
          return await routedProvider.generateResponse(prompt, context || undefined);
        } catch (error) {
          console.warn('Routed LLM failed, trying backup:', error);
          if (this.strategy?.enableBackupSystem) {
            return this.useBackupLLM(input, context);
          }
          throw error;
        }
      }
    }

    // Fallback para modo econômico
    return this.economicMode(input, context);
  }

  private async premiumMode(input: string, context?: string): Promise<string> {
    // Modo premium: Sistema completo com validação
    const initialResponse = await this.balancedMode(input, context);

    if (this.strategy?.enableValidation) {
      try {
        const validationResult = await this.validateResponse(initialResponse, input, context || undefined);
        return validationResult;
      } catch (error) {
        console.warn('Validation failed, returning initial response:', error);
        return initialResponse;
      }
    }

    return initialResponse;
  }

  private async useBackupLLM(input: string, context?: string): Promise<string> {
    const backupConfigs = await storage.getBackupLlmConfigs();
    
    for (const config of backupConfigs) {
      const provider = this.providers.get(config.name);
      if (provider && await provider.isHealthy()) {
        try {
          const prompt = this.buildPrompt(input);
          return await provider.generateResponse(prompt, context || undefined);
        } catch (error) {
          console.warn(`Backup LLM ${config.name} failed:`, error);
          continue;
        }
      }
    }

    throw new Error('All LLM providers failed');
  }

  private routeBySubject(input: string): LLMProvider | null {
    const lowerInput = input.toLowerCase();

    // Roteamento baseado em palavras-chave
    if (lowerInput.includes('financeiro') || lowerInput.includes('crédito') || lowerInput.includes('extrato')) {
      // Claude é melhor para análise financeira conservadora
      return this.providers.get('anthropic') || null;
    }

    if (lowerInput.includes('imagem') || lowerInput.includes('áudio') || lowerInput.includes('arquivo')) {
      // GPT-4o é melhor para multimodal
      return this.providers.get('openai') || null;
    }

    if (lowerInput.includes('técnico') || lowerInput.includes('código') || lowerInput.includes('dados')) {
      // Gemini é bom para análise técnica
      return this.providers.get('google') || null;
    }

    return null;
  }

  private async validateResponse(response: string, originalInput: string, context?: string): Promise<string> {
    const backupConfigs = await storage.getBackupLlmConfigs();
    const validationConfig = backupConfigs.find(c => c.name !== this.getLastUsedProvider());
    
    if (!validationConfig) {
      return response;
    }

    const validationProvider = this.providers.get(validationConfig.name);
    if (!validationProvider) {
      return response;
    }

    try {
      const validationPrompt = `
        Você é um validador de análises financeiras. Analise a resposta abaixo e verifique se está correta, completa e precisa.
        
        Pergunta original: ${originalInput}
        Contexto: ${context || 'Não fornecido'}
        
        Resposta para validar:
        ${response}
        
        Se a resposta estiver correta, responda: "VALIDADO: [resposta original]"
        Se houver problemas, forneça uma versão melhorada precedida de "MELHORADO: "
      `;

      const validationResult = await validationProvider.generateResponse(validationPrompt);
      
      if (validationResult.startsWith('VALIDADO:')) {
        return response;
      } else if (validationResult.startsWith('MELHORADO:')) {
        return validationResult.substring(11).trim();
      }
      
      return response;
    } catch (error) {
      console.warn('Validation failed:', error);
      return response;
    }
  }

  private buildPrompt(input: string): string {
    if (!this.prompts) {
      return input;
    }

    // Usar prompts em cadeia se configurado
    const prompts = [
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
    ].filter(p => p && p.trim().length > 0);

    if (prompts.length === 0) {
      return input;
    }

    // Combinar prompts em sistema base
    const systemPrompt = prompts.join('\n\n');
    return `${systemPrompt}\n\nTarefa: ${input}`;
  }

  private getLastUsedProvider(): string {
    // Implementar lógica para rastrear último provedor usado
    return 'openai'; // Placeholder
  }

  async processChainedPrompts(input: string, context?: string): Promise<string> {
    if (!this.prompts) {
      return this.processRequest(input, context);
    }

    const prompts = [
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
    ].filter(p => p && p.trim().length > 0) as string[];

    if (prompts.length <= 1) {
      return this.processRequest(input, context);
    }

    let currentResult = (context ?? input) || '';
    
    // Processar prompts em sequência
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      if (!prompt) continue;
      
      try {
        const result = await this.processRequest(prompt, currentResult || undefined);
        currentResult = result;
        console.log(`Chain step ${i + 1} completed`);
      } catch (error) {
        console.error(`Chain step ${i + 1} failed:`, error);
        break;
      }
    }

    return currentResult;
  }
}

export const multiLlmOrchestrator = new MultiLLMOrchestrator();