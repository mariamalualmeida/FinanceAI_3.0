import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';

/*
 * ADVANCED MULTI-LLM ORCHESTRATOR v3.0
 * Features: Configurable hierarchy, cross-validation, AI enhancement, specialization
 * Supports: Gemini, Claude, OpenAI, xAI Grok
 */

export interface LLMProvider {
  name: string;
  priority: number;
  specialties: string[];
  generateResponse: (prompt: string, options?: any) => Promise<string>;
  isAvailable: () => Promise<boolean>;
  validateResponse?: (response: string) => boolean;
  cost: number; // Custo relativo por token
}

export interface LLMConfig {
  primary: string;
  backups: string[];
  specializations: {
    [task: string]: string;
  };
  strategies: {
    validation: boolean;
    enhancement: boolean;
    consensus: boolean;
    costOptimization: boolean;
  };
  thresholds: {
    confidenceMin: number;
    consensusRequired: number;
    maxRetries: number;
  };
}

export interface AnalysisResult {
  response: string;
  provider: string;
  enhanced: boolean;
  validated: boolean;
  confidence: number;
  processingTime: number;
  cost: number;
  validationDetails?: string;
  enhancementSteps?: string[];
}

export interface TaskSpecialization {
  documentAnalysis: string;
  financialExtraction: string;
  reportGeneration: string;
  riskAssessment: string;
  patternDetection: string;
  summaryGeneration: string;
}

export class AdvancedMultiLLMOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();
  private config: LLMConfig;
  private specializations: TaskSpecialization;

  constructor(customConfig?: Partial<LLMConfig>) {
    this.config = {
      primary: 'gemini',
      backups: ['anthropic', 'openai', 'grok'],
      specializations: {
        'document_analysis': 'anthropic',
        'financial_extraction': 'gemini', 
        'report_generation': 'openai',
        'risk_assessment': 'anthropic',
        'pattern_detection': 'gemini',
        'summary_generation': 'openai'
      },
      strategies: {
        validation: true,
        enhancement: true,
        consensus: false,
        costOptimization: true
      },
      thresholds: {
        confidenceMin: 0.7,
        consensusRequired: 2,
        maxRetries: 3
      },
      ...customConfig
    };

    this.specializations = {
      documentAnalysis: 'anthropic',    // Claude excels at document understanding
      financialExtraction: 'gemini',    // Gemini great at structured data
      reportGeneration: 'openai',       // GPT-4o excellent for reports
      riskAssessment: 'anthropic',      // Claude good at risk analysis
      patternDetection: 'gemini',       // Gemini pattern recognition
      summaryGeneration: 'openai'       // GPT-4o great summaries
    };

    this.initialize();
  }

  async initialize() {
    try {
      console.log('🚀 Initializing Advanced Multi-LLM Orchestrator v3.0...');
      
      // Initialize Gemini (Priority 1)
      if (process.env.GEMINI_API_KEY) {
        console.log('✅ Initializing Gemini as PRIMARY');
        const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        
        const geminiProvider: LLMProvider = {
          name: 'gemini',
          priority: 1,
          specialties: ['financial_extraction', 'pattern_detection', 'multimodal_analysis'],
          cost: 0.5,
          generateResponse: async (prompt: string, options = {}) => {
            const response = await geminiClient.models.generateContent({
              model: options.model || 'gemini-2.5-flash',
              contents: prompt,
              config: options.config || {}
            });
            return response.text || '';
          },
          isAvailable: async () => {
            try {
              const test = await geminiClient.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Test'
              });
              return !!test.text;
            } catch {
              return false;
            }
          },
          validateResponse: (response: string) => {
            return response.length > 10 && !response.includes('error') && !response.includes('failed');
          }
        };
        
        this.providers.set('gemini', geminiProvider);
        console.log('✅ Gemini provider initialized');
      }

      // Initialize Claude (Priority 2)
      if (process.env.ANTHROPIC_API_KEY) {
        console.log('✅ Initializing Claude as BACKUP');
        const claudeClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        
        const claudeProvider: LLMProvider = {
          name: 'anthropic',
          priority: 2,
          specialties: ['document_analysis', 'risk_assessment', 'complex_reasoning'],
          cost: 1.0,
          generateResponse: async (prompt: string, options = {}) => {
            const response = await claudeClient.messages.create({
              model: options.model || 'claude-sonnet-4-20250514',
              max_tokens: options.maxTokens || 2000,
              messages: [{ role: 'user', content: prompt }]
            });
            return response.content[0].text || '';
          },
          isAvailable: async () => {
            try {
              const test = await claudeClient.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 10,
                messages: [{ role: 'user', content: 'Test' }]
              });
              return !!test.content[0];
            } catch {
              return false;
            }
          },
          validateResponse: (response: string) => {
            return response.length > 10 && !response.includes('I cannot') && !response.includes('I\'m unable');
          }
        };
        
        this.providers.set('anthropic', claudeProvider);
        console.log('✅ Claude provider initialized');
      }

      // Initialize OpenAI (Priority 3)
      if (process.env.OPENAI_API_KEY) {
        console.log('✅ Initializing OpenAI as TERTIARY');
        const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const openaiProvider: LLMProvider = {
          name: 'openai',
          priority: 3,
          specialties: ['report_generation', 'summary_generation', 'creative_writing'],
          cost: 0.8,
          generateResponse: async (prompt: string, options = {}) => {
            const response = await openaiClient.chat.completions.create({
              model: options.model || 'gpt-4o',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: options.maxTokens || 2000,
              temperature: options.temperature || 0.7
            });
            return response.choices[0].message.content || '';
          },
          isAvailable: async () => {
            try {
              const test = await openaiClient.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 5
              });
              return !!test.choices[0];
            } catch {
              return false;
            }
          },
          validateResponse: (response: string) => {
            return response.length > 10 && !response.includes('I apologize') && !response.includes('I cannot provide');
          }
        };
        
        this.providers.set('openai', openaiProvider);
        console.log('✅ OpenAI provider initialized');
      }

      // Initialize xAI Grok (Priority 4)
      if (process.env.XAI_API_KEY) {
        console.log('✅ Initializing xAI Grok as QUATERNARY');
        const grokClient = new OpenAI({ 
          baseURL: "https://api.x.ai/v1", 
          apiKey: process.env.XAI_API_KEY 
        });
        
        const grokProvider: LLMProvider = {
          name: 'grok',
          priority: 4,
          specialties: ['risk_assessment', 'anomaly_detection', 'contrarian_analysis'],
          cost: 0.6,
          generateResponse: async (prompt: string, options = {}) => {
            const response = await grokClient.chat.completions.create({
              model: options.model || 'grok-2-1212',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: options.maxTokens || 2000
            });
            return response.choices[0].message.content || '';
          },
          isAvailable: async () => {
            try {
              const test = await grokClient.chat.completions.create({
                model: 'grok-2-1212',
                messages: [{ role: 'user', content: 'Test' }],
                max_tokens: 5
              });
              return !!test.choices[0];
            } catch {
              return false;
            }
          },
          validateResponse: (response: string) => {
            return response.length > 10;
          }
        };
        
        this.providers.set('grok', grokProvider);
        console.log('✅ xAI Grok provider initialized');
      }

      console.log(`🎯 Advanced Multi-LLM Orchestrator initialized with ${this.providers.size} providers`);
      console.log(`📋 Available providers: ${Array.from(this.providers.keys()).join(', ')}`);
      console.log(`🔧 Primary: ${this.config.primary} | Backups: ${this.config.backups.join(', ')}`);
      
    } catch (error) {
      console.error('❌ Error initializing Advanced Multi-LLM orchestrator:', error);
    }
  }

  // MÉTODO PRINCIPAL: Análise inteligente com todas as funcionalidades
  async analyzeWithIntelligentOrchestration(
    prompt: string, 
    taskType: keyof TaskSpecialization = 'documentAnalysis',
    options: any = {}
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔍 Starting intelligent analysis for task: ${taskType}`);
      
      // 1. ESPECIALIZAÇÃO: Escolher LLM especializada para tarefa
      const specializedProvider = this.getSpecializedProvider(taskType);
      console.log(`🎯 Specialized provider for ${taskType}: ${specializedProvider}`);
      
      // 2. ANÁLISE PRIMÁRIA
      let primaryResult = await this.generateWithProvider(specializedProvider, prompt, options);
      
      if (!primaryResult.success) {
        // Fallback para hierarquia configurada
        primaryResult = await this.generateWithHierarchy(prompt, options);
      }
      
      if (!primaryResult.success) {
        throw new Error('All LLM providers failed');
      }
      
      let finalResponse = primaryResult.response;
      let enhanced = false;
      let validated = false;
      let confidence = 0.8;
      const enhancementSteps: string[] = [];
      
      // 3. VALIDAÇÃO CRUZADA (se habilitada)
      if (this.config.strategies.validation && this.providers.size > 1) {
        console.log('🔍 Performing cross-validation...');
        const validationResult = await this.performCrossValidation(finalResponse, prompt);
        
        if (validationResult.isValid) {
          validated = true;
          confidence = Math.min(confidence + 0.1, 1.0);
          console.log('✅ Cross-validation passed');
        } else {
          console.log('⚠️ Cross-validation failed, using corrected response');
          finalResponse = validationResult.correctedResponse || finalResponse;
          validated = true;
        }
      }
      
      // 4. ENHANCEMENT INTELIGENTE (se habilitado)
      if (this.config.strategies.enhancement && this.providers.size > 1) {
        console.log('🚀 Performing AI enhancement...');
        const enhancementResult = await this.performAIEnhancement(finalResponse, prompt, primaryResult.provider);
        
        if (enhancementResult.enhanced) {
          finalResponse = enhancementResult.response;
          enhanced = true;
          confidence = Math.min(confidence + 0.15, 1.0);
          enhancementSteps.push(...enhancementResult.steps);
          console.log('✅ AI enhancement completed');
        }
      }
      
      // 5. CONSENSO (se habilitado e necessário)
      if (this.config.strategies.consensus && confidence < this.config.thresholds.confidenceMin) {
        console.log('🗳️ Performing consensus analysis...');
        const consensusResult = await this.performConsensusAnalysis(prompt, options);
        
        if (consensusResult.consensus) {
          finalResponse = consensusResult.response;
          confidence = consensusResult.confidence;
          console.log('✅ Consensus achieved');
        }
      }
      
      const processingTime = Date.now() - startTime;
      
      return {
        response: finalResponse,
        provider: primaryResult.provider,
        enhanced,
        validated,
        confidence,
        processingTime,
        cost: this.calculateCost(primaryResult.provider, finalResponse.length),
        enhancementSteps: enhancementSteps.length > 0 ? enhancementSteps : undefined
      };
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      // Fallback para sistema local se tudo falhar
      return {
        response: 'Análise temporariamente indisponível. Sistema local pode ser usado como fallback.',
        provider: 'fallback',
        enhanced: false,
        validated: false,
        confidence: 0.3,
        processingTime: Date.now() - startTime,
        cost: 0
      };
    }
  }

  // Escolher provedor especializado para tarefa
  private getSpecializedProvider(taskType: keyof TaskSpecialization): string {
    const specialized = this.specializations[taskType];
    
    // Verificar se o provedor especializado está disponível
    if (this.providers.has(specialized)) {
      return specialized;
    }
    
    // Fallback para primário configurado
    if (this.providers.has(this.config.primary)) {
      return this.config.primary;
    }
    
    // Fallback para primeiro disponível
    return Array.from(this.providers.keys())[0];
  }

  // Gerar resposta com provedor específico
  private async generateWithProvider(providerName: string, prompt: string, options: any) {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      return { success: false, response: '', provider: providerName };
    }
    
    try {
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        console.log(`❌ Provider ${providerName} not available`);
        return { success: false, response: '', provider: providerName };
      }
      
      const response = await provider.generateResponse(prompt, options);
      
      if (provider.validateResponse && !provider.validateResponse(response)) {
        console.log(`❌ Provider ${providerName} validation failed`);
        return { success: false, response: '', provider: providerName };
      }
      
      console.log(`✅ Provider ${providerName} generated response (${response.length} chars)`);
      return { success: true, response, provider: providerName };
      
    } catch (error) {
      console.log(`❌ Provider ${providerName} error:`, error.message);
      return { success: false, response: '', provider: providerName };
    }
  }

  // Gerar com hierarquia de fallback
  private async generateWithHierarchy(prompt: string, options: any) {
    const hierarchy = [this.config.primary, ...this.config.backups];
    
    for (const providerName of hierarchy) {
      if (this.providers.has(providerName)) {
        const result = await this.generateWithProvider(providerName, prompt, options);
        if (result.success) {
          return result;
        }
      }
    }
    
    return { success: false, response: '', provider: 'none' };
  }

  // Validação cruzada entre LLMs
  private async performCrossValidation(response: string, originalPrompt: string) {
    try {
      const validationPrompt = `
        Analise a seguinte resposta para uma pergunta sobre análise financeira:
        
        PERGUNTA ORIGINAL: ${originalPrompt}
        
        RESPOSTA PARA VALIDAR: ${response}
        
        Sua tarefa:
        1. A resposta está correta e completa?
        2. Há erros factuais ou inconsistências?
        3. Faltam informações importantes?
        
        Responda APENAS:
        VÁLIDA: [SIM/NÃO]
        CORREÇÕES: [se necessário, forneça versão corrigida]
      `;
      
      // Usar um provedor diferente para validação
      const validatorName = this.getValidatorProvider();
      const validationResult = await this.generateWithProvider(validatorName, validationPrompt, {});
      
      if (validationResult.success) {
        const isValid = validationResult.response.includes('VÁLIDA: SIM');
        const correctionMatch = validationResult.response.match(/CORREÇÕES: (.+)/s);
        const correctedResponse = correctionMatch ? correctionMatch[1].trim() : null;
        
        return {
          isValid,
          correctedResponse: !isValid ? correctedResponse : null,
          validator: validatorName
        };
      }
      
      return { isValid: true, correctedResponse: null, validator: 'none' };
      
    } catch (error) {
      console.error('❌ Cross-validation error:', error);
      return { isValid: true, correctedResponse: null, validator: 'error' };
    }
  }

  // Enhancement com AI (usar contexto de uma LLM para melhorar outra)
  private async performAIEnhancement(response: string, originalPrompt: string, usedProvider: string) {
    try {
      const enhancementPrompt = `
        Você recebeu uma análise financeira inicial. Sua tarefa é MELHORAR e EXPANDIR esta análise:
        
        PERGUNTA ORIGINAL: ${originalPrompt}
        
        ANÁLISE INICIAL: ${response}
        
        Melhore esta análise:
        1. Adicione insights mais profundos
        2. Inclua análise de padrões não mencionados
        3. Forneça recomendações mais específicas
        4. Adicione contexto brasileiro relevante
        5. Mantenha a estrutura mas expanda o conteúdo
        
        Forneça a versão MELHORADA e EXPANDIDA:
      `;
      
      // Usar um provedor diferente para enhancement
      const enhancerName = this.getEnhancerProvider(usedProvider);
      const enhancementResult = await this.generateWithProvider(enhancerName, enhancementPrompt, {});
      
      if (enhancementResult.success && enhancementResult.response.length > response.length * 1.2) {
        return {
          enhanced: true,
          response: enhancementResult.response,
          steps: [`Enhanced by ${enhancerName}`, `Original: ${response.length} chars`, `Enhanced: ${enhancementResult.response.length} chars`]
        };
      }
      
      return { enhanced: false, response, steps: [] };
      
    } catch (error) {
      console.error('❌ AI enhancement error:', error);
      return { enhanced: false, response, steps: [] };
    }
  }

  // Análise por consenso (múltiplas LLMs votam)
  private async performConsensusAnalysis(prompt: string, options: any) {
    try {
      const providers = Array.from(this.providers.keys()).slice(0, this.config.thresholds.consensusRequired);
      const responses: { provider: string; response: string }[] = [];
      
      for (const providerName of providers) {
        const result = await this.generateWithProvider(providerName, prompt, options);
        if (result.success) {
          responses.push({ provider: providerName, response: result.response });
        }
      }
      
      if (responses.length >= 2) {
        // Prompt para síntese de consenso
        const consensusPrompt = `
          Analise as seguintes respostas para uma pergunta sobre análise financeira e crie uma RESPOSTA CONSENSUAL:
          
          PERGUNTA: ${prompt}
          
          ${responses.map((r, i) => `RESPOSTA ${i + 1} (${r.provider}): ${r.response}`).join('\n\n')}
          
          Crie uma resposta que:
          1. Combine os melhores insights de todas as respostas
          2. Resolva contradições priorizando informações mais precisas
          3. Mantenha estrutura clara e profissional
          4. Inclua apenas informações que aparecem em pelo menos 2 respostas
          
          RESPOSTA CONSENSUAL:
        `;
        
        const consensusResult = await this.generateWithProvider(providers[0], consensusPrompt, options);
        
        if (consensusResult.success) {
          return {
            consensus: true,
            response: consensusResult.response,
            confidence: 0.9,
            sources: responses.map(r => r.provider)
          };
        }
      }
      
      return { consensus: false, response: '', confidence: 0.5, sources: [] };
      
    } catch (error) {
      console.error('❌ Consensus analysis error:', error);
      return { consensus: false, response: '', confidence: 0.3, sources: [] };
    }
  }

  // Selecionar validador diferente do usado
  private getValidatorProvider(): string {
    const available = Array.from(this.providers.keys());
    
    // Priorizar Claude para validação (forte em análise)
    if (available.includes('anthropic')) return 'anthropic';
    if (available.includes('openai')) return 'openai';
    if (available.includes('gemini')) return 'gemini';
    if (available.includes('grok')) return 'grok';
    
    return available[0];
  }

  // Selecionar enhancer diferente do usado
  private getEnhancerProvider(usedProvider: string): string {
    const available = Array.from(this.providers.keys()).filter(p => p !== usedProvider);
    
    // Priorizar OpenAI para enhancement (forte em elaboração)
    if (available.includes('openai')) return 'openai';
    if (available.includes('anthropic')) return 'anthropic';
    if (available.includes('gemini')) return 'gemini';
    if (available.includes('grok')) return 'grok';
    
    return available[0] || usedProvider;
  }

  // Calcular custo da operação
  private calculateCost(provider: string, responseLength: number): number {
    const providerData = this.providers.get(provider);
    if (!providerData) return 0;
    
    const tokens = Math.ceil(responseLength / 4); // Aproximação de tokens
    return providerData.cost * tokens * 0.001; // Custo por 1000 tokens
  }

  // CONFIGURAÇÃO DINÂMICA
  updateConfig(newConfig: Partial<LLMConfig>) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Configuration updated:', this.config);
  }

  updateSpecializations(newSpecializations: Partial<TaskSpecialization>) {
    this.specializations = { ...this.specializations, ...newSpecializations };
    console.log('🎯 Specializations updated:', this.specializations);
  }

  // MÉTODO SIMPLES PARA COMPATIBILIDADE
  async generateResponse(prompt: string, context?: string): Promise<string> {
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;
    const result = await this.analyzeWithIntelligentOrchestration(fullPrompt);
    return result.response;
  }

  // STATUS E MONITORAMENTO
  getStatus() {
    return {
      providers: Array.from(this.providers.keys()),
      config: this.config,
      specializations: this.specializations,
      totalProviders: this.providers.size
    };
  }

  async healthCheck() {
    const status: { [key: string]: boolean } = {};
    
    for (const [name, provider] of this.providers) {
      try {
        status[name] = await provider.isAvailable();
      } catch {
        status[name] = false;
      }
    }
    
    return status;
  }
}

export const advancedMultiLLMOrchestrator = new AdvancedMultiLLMOrchestrator();