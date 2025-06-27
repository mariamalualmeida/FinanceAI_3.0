import { storage } from './storage';

export async function initializeDefaultConfigs() {
  try {
    console.log('Inicializando configurações padrão do sistema...');

    // 1. Configurar LLM padrão (OpenAI)
    const existingLlms = await storage.getEnabledLlmConfigs();
    if (existingLlms.length === 0) {
      console.log('Criando configuração padrão da OpenAI...');
      await storage.createLlmConfig({
        name: 'openai',
        model: 'gpt-4o',
        apiKey: process.env.OPENAI_API_KEY || '',
        isEnabled: true,
        temperature: 0.7,
        maxTokens: 4000,
        isPrimary: true
      });

      if (process.env.ANTHROPIC_API_KEY) {
        console.log('Criando configuração da Anthropic...');
        await storage.createLlmConfig({
          name: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          apiKey: process.env.ANTHROPIC_API_KEY,
          isEnabled: true,
          temperature: 0.7,
          maxTokens: 4000,
          isPrimary: false
        });
      }

      if (process.env.GOOGLE_AI_API_KEY) {
        console.log('Criando configuração do Google...');
        await storage.createLlmConfig({
          name: 'google',
          model: 'gemini-2.5-flash',
          apiKey: process.env.GOOGLE_AI_API_KEY,
          isEnabled: true,
          temperature: 0.7,
          maxTokens: 4000,
          isPrimary: false
        });
      }
    }

    // 2. Configurar estratégia Multi-LLM padrão
    const existingStrategy = await storage.getActiveMultiLlmStrategy();
    if (!existingStrategy) {
      console.log('Criando estratégia Multi-LLM padrão...');
      await storage.createMultiLlmStrategy({
        name: 'Estratégia Balanceada Padrão',
        mode: 'balanced',
        isActive: true,
        enableSubjectRouting: true,
        enableBackupSystem: true,
        enableValidation: false,
        description: 'Estratégia balanceada com roteamento inteligente e sistema de backup'
      });
    }

    // 3. Configurar prompts de sistema padrão
    const existingPrompts = await storage.getActiveSystemPrompts();
    if (existingPrompts.length === 0) {
      console.log('Criando prompts de sistema padrão...');
      await storage.createSystemPrompts({
        name: 'Prompts Financeiros Padrão',
        isActive: true,
        prompt1: 'Você é especialista em análise de crédito e avaliação de risco financeiro.',
        prompt2: 'Sempre base suas análises em dados concretos fornecidos pelos usuários.',
        prompt3: 'Forneça recomendações práticas e acionáveis para melhoria do perfil financeiro.',
        prompt4: 'Identifique padrões de gastos suspeitos, especialmente relacionados a apostas.',
        prompt5: 'Calcule scores de crédito considerando histórico de pagamentos e comportamento.',
        prompt6: '',
        prompt7: '',
        prompt8: '',
        prompt9: '',
        prompt10: '',
        prompt11: '',
        prompt12: ''
      });
    }

    console.log('✅ Configurações padrão inicializadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar configurações padrão:', error);
  }
}