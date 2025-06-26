import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";

/*
<important_code_snippet_instructions>
The newest Anthropic model is "claude-sonnet-4-20250514", not "claude-3-7-sonnet-20250219", "claude-3-5-sonnet-20241022" nor "claude-3-sonnet-20240229". 
The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
The newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
</important_code_snippet_instructions>
*/

// <important_do_not_delete>
const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_OPENAI_MODEL = "gpt-4o";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
// </important_do_not_delete>

export interface LLMProvider {
  generateResponse(prompt: string, context?: any): Promise<string>;
  analyzeFinancialData(data: any): Promise<any>;
  generateReport(analysisData: any): Promise<string>;
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    try {
      const systemPrompt = `Você é um assistente especializado em análise financeira e consultoria de crédito. 
      Você tem acesso a dados financeiros detalhados e pode fornecer insights sobre:
      - Análise de risco de crédito
      - Detecção de padrões suspeitos
      - Avaliação de movimentações bancárias
      - Cálculo de scores de crédito
      - Identificação de apostas e atividades de risco
      
      Sempre forneça respostas precisas, profissionais e baseadas em dados.
      ${context ? `\n\nContexto adicional: ${JSON.stringify(context)}` : ''}`;

      const response = await this.client.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate response from OpenAI');
    }
  }

  async analyzeFinancialData(data: any): Promise<any> {
    try {
      const prompt = `Analise os seguintes dados financeiros e forneça um resumo detalhado em JSON:

${JSON.stringify(data, null, 2)}

Forneça a análise no seguinte formato JSON:
{
  "resumo_geral": "string",
  "score_credito": number,
  "nivel_risco": "baixo|medio|alto",
  "alertas": ["string"],
  "recomendacoes": ["string"],
  "movimentacoes_suspeitas": ["string"],
  "apostas_detectadas": {
    "encontradas": boolean,
    "valor_total": number,
    "detalhes": ["string"]
  },
  "padrao_gastos": {
    "categoria_principal": "string",
    "valor_medio_mensal": number,
    "consistencia_renda": "string"
  }
}`;

      const response = await this.client.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('OpenAI financial analysis error:', error);
      throw new Error('Failed to analyze financial data');
    }
  }

  async generateReport(analysisData: any): Promise<string> {
    try {
      const prompt = `Gere um relatório profissional de análise financeira baseado nos seguintes dados:

${JSON.stringify(analysisData, null, 2)}

O relatório deve incluir:
1. Resumo executivo
2. Análise detalhada do perfil financeiro
3. Score de crédito e justificativa
4. Identificação de riscos
5. Recomendações específicas
6. Conclusão

Use linguagem profissional e técnica apropriada para consultoria financeira.`;

      const response = await this.client.chat.completions.create({
        model: DEFAULT_OPENAI_MODEL,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      console.error('OpenAI report generation error:', error);
      throw new Error('Failed to generate report');
    }
  }
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    try {
      const systemPrompt = `Você é um assistente especializado em análise financeira e consultoria de crédito. 
      Você tem acesso a dados financeiros detalhados e pode fornecer insights sobre análise de risco, 
      detecção de padrões suspeitos, avaliação de movimentações bancárias, cálculo de scores de crédito 
      e identificação de apostas. Sempre forneça respostas precisas e profissionais.
      ${context ? `\n\nContexto: ${JSON.stringify(context)}` : ''}`;

      const response = await this.client.messages.create({
        model: DEFAULT_ANTHROPIC_MODEL,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic API error:', error);
      throw new Error('Failed to generate response from Anthropic');
    }
  }

  async analyzeFinancialData(data: any): Promise<any> {
    try {
      const prompt = `Analise os seguintes dados financeiros e forneça um resumo detalhado em JSON:

${JSON.stringify(data, null, 2)}

Responda APENAS com JSON válido no formato especificado.`;

      const response = await this.client.messages.create({
        model: DEFAULT_ANTHROPIC_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.1,
      });

      return JSON.parse(response.content[0].text);
    } catch (error) {
      console.error('Anthropic financial analysis error:', error);
      throw new Error('Failed to analyze financial data');
    }
  }

  async generateReport(analysisData: any): Promise<string> {
    try {
      const prompt = `Gere um relatório profissional de análise financeira baseado nos dados fornecidos. 
      Inclua resumo executivo, análise detalhada, score de crédito, identificação de riscos e recomendações.

Dados: ${JSON.stringify(analysisData, null, 2)}`;

      const response = await this.client.messages.create({
        model: DEFAULT_ANTHROPIC_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.2,
      });

      return response.content[0].text;
    } catch (error) {
      console.error('Anthropic report generation error:', error);
      throw new Error('Failed to generate report');
    }
  }
}

export class GeminiProvider implements LLMProvider {
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateResponse(prompt: string, context?: any): Promise<string> {
    try {
      const systemPrompt = `Você é um assistente especializado em análise financeira e consultoria de crédito.
      ${context ? `\n\nContexto: ${JSON.stringify(context)}` : ''}`;

      const response = await this.client.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.3,
        },
        contents: prompt,
      });

      return response.text || '';
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate response from Gemini');
    }
  }

  async analyzeFinancialData(data: any): Promise<any> {
    try {
      const prompt = `Analise os dados financeiros e responda em JSON: ${JSON.stringify(data)}`;

      const response = await this.client.models.generateContent({
        model: "gemini-2.5-pro",
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
        contents: prompt,
      });

      return JSON.parse(response.text || '{}');
    } catch (error) {
      console.error('Gemini financial analysis error:', error);
      throw new Error('Failed to analyze financial data');
    }
  }

  async generateReport(analysisData: any): Promise<string> {
    try {
      const prompt = `Gere um relatório profissional de análise financeira: ${JSON.stringify(analysisData)}`;

      const response = await this.client.models.generateContent({
        model: DEFAULT_GEMINI_MODEL,
        config: {
          temperature: 0.2,
        },
        contents: prompt,
      });

      return response.text || '';
    } catch (error) {
      console.error('Gemini report generation error:', error);
      throw new Error('Failed to generate report');
    }
  }
}

export class LLMService {
  private providers: Map<string, LLMProvider> = new Map();

  constructor() {
    // Initialize providers with environment variables
    if (process.env.OPENAI_API_KEY) {
      this.providers.set('openai', new OpenAIProvider(process.env.OPENAI_API_KEY));
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('anthropic', new AnthropicProvider(process.env.ANTHROPIC_API_KEY));
    }
    if (process.env.GEMINI_API_KEY) {
      this.providers.set('gemini', new GeminiProvider(process.env.GEMINI_API_KEY));
    }
  }

  getProvider(providerName: string, apiKey?: string): LLMProvider {
    if (apiKey) {
      // Create a new provider instance with custom API key
      switch (providerName) {
        case 'openai':
          return new OpenAIProvider(apiKey);
        case 'anthropic':
          return new AnthropicProvider(apiKey);
        case 'gemini':
          return new GeminiProvider(apiKey);
        default:
          throw new Error(`Unknown provider: ${providerName}`);
      }
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not available. Check API key configuration.`);
    }
    return provider;
  }

  async generateChatResponse(
    prompt: string, 
    providerName: string = 'openai', 
    context?: any,
    userApiKey?: string
  ): Promise<string> {
    const provider = this.getProvider(providerName, userApiKey);
    return provider.generateResponse(prompt, context);
  }

  async analyzeFinancialData(
    data: any, 
    providerName: string = 'openai',
    userApiKey?: string
  ): Promise<any> {
    const provider = this.getProvider(providerName, userApiKey);
    return provider.analyzeFinancialData(data);
  }

  async generateFinancialReport(
    analysisData: any, 
    providerName: string = 'openai',
    userApiKey?: string
  ): Promise<string> {
    const provider = this.getProvider(providerName, userApiKey);
    return provider.generateReport(analysisData);
  }
}

export const llmService = new LLMService();
