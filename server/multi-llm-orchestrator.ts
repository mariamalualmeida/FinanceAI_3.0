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
    // Carregear configurações dos LLMs
    const llmConfigs = await storage.getEnabledLlmConfigs();
    const activeStrategy = await storage.getActiveMultiLlmStrategy();
    const systemPrompts = await storage.getActiveSystemPrompts();

    this.strategy = activeStrategy || null;
    this.prompts = systemPrompts[0] || null;

    // Inicializar provedores
    for (const config of llmConfigs) {
      await this.initializeProvider(config);
    }
  }

  private async initializeProvider(config: LlmConfig) {
    try {
      let provider: LLMProvider;

      switch (config.name) {
        case 'openai':
          const openai = new OpenAI({ 
            apiKey: config.apiKey || process.env.OPENAI_API_KEY 
          });
          provider = {
            name: 'openai',
            client: openai,
            generateResponse: async (prompt: string, context?: string) => {
              const messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: context || 'Analise os dados fornecidos.' }
              ];
              
              const response = await openai.chat.completions.create({
                model: config.model,
                messages: messages as any,
                temperature: parseFloat(config.temperature?.toString() || '0.7'),
                max_tokens: config.maxTokens || 4000
              });
              
              return response.choices[0].message.content || '';
            },
            isHealthy: async () => {
              try {
                await openai.models.list();
                return true;
              } catch {
                return false;
              }
            }
          };
          break;

        case 'anthropic':
          const anthropic = new Anthropic({ 
            apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY 
          });
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
          const genai = new GoogleGenAI({ 
            apiKey: config.apiKey || process.env.GOOGLE_AI_API_KEY 
          });
          provider = {
            name: 'google',
            client: genai,
            generateResponse: async (prompt: string, context?: string) => {
              const response = await genai.models.generateContent({
                model: config.model,
                contents: `${prompt}\n\n${context || 'Analise os dados fornecidos.'}`,
                config: {
                  temperature: parseFloat(config.temperature?.toString() || '0.7'),
                  maxOutputTokens: config.maxTokens || 4000
                }
              });
              
              return response.text || '';
            },
            isHealthy: async () => {
              try {
                await genai.models.generateContent({
                  model: config.model,
                  contents: 'test'
                });
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
    // Modo econômico: Uma LLM principal + backup
    const primaryConfig = await storage.getPrimaryLlmConfig();
    if (!primaryConfig) {
      throw new Error('No primary LLM configured');
    }

    const primaryProvider = this.providers.get(primaryConfig.name);
    if (!primaryProvider) {
      throw new Error(`Primary provider ${primaryConfig.name} not available`);
    }

    try {
      // Tentar usar a LLM principal
      const prompt = this.buildPrompt(input);
      return await primaryProvider.generateResponse(prompt, context || undefined);
    } catch (error) {
      console.warn('Primary LLM failed, trying backup:', error);
      
      // Fallback para backup
      if (this.strategy?.enableBackupSystem) {
        return this.useBackupLLM(input, context);
      }
      
      throw error;
    }
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