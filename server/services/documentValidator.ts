import OpenAI from 'openai';
// import { GoogleGenerativeAI } from '@google/genai'; // Will be enabled when Google API is available
import fs from 'fs';
import path from 'path';

interface ValidationResult {
  documentName: string;
  extractedData: any;
  validationScore: number; // 0-100
  discrepancies: string[];
  accuracy: {
    transactions: number;
    dates: number;
    amounts: number;
    descriptions: number;
  };
  recommendations: string[];
}

interface APIProvider {
  name: string;
  test: () => Promise<boolean>;
  validate: (documentText: string, extractedData: any) => Promise<ValidationResult>;
}

class DocumentValidator {
  private providers: APIProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private async initializeProviders() {
    // OpenAI Provider
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.providers.push({
        name: 'OpenAI',
        test: async () => {
          try {
            const response = await openai.chat.completions.create({
              model: 'gpt-4o',
              messages: [{ role: 'user', content: 'Test connection' }],
              max_tokens: 5
            });
            return !!response.choices[0];
          } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
          }
        },
        validate: async (documentText: string, extractedData: any) => {
          return this.validateWithOpenAI(openai, documentText, extractedData);
        }
      });
    }

    // Google Gemini Provider (Disabled until proper API is configured)
    // if (process.env.GOOGLE_API_KEY) {
    //   console.log('Google API available but temporarily disabled for testing');
    // }

    // xAI Provider
    if (process.env.XAI_API_KEY) {
      const xai = new OpenAI({ 
        baseURL: "https://api.x.ai/v1", 
        apiKey: process.env.XAI_API_KEY 
      });
      this.providers.push({
        name: 'xAI Grok',
        test: async () => {
          try {
            const response = await xai.chat.completions.create({
              model: 'grok-2-1212',
              messages: [{ role: 'user', content: 'Test connection' }],
              max_tokens: 5
            });
            return !!response.choices[0];
          } catch (error) {
            console.error('xAI connection test failed:', error);
            return false;
          }
        },
        validate: async (documentText: string, extractedData: any) => {
          return this.validateWithXAI(xai, documentText, extractedData);
        }
      });
    }
  }

  async testAllAPIs(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const provider of this.providers) {
      console.log(`Testing ${provider.name} API...`);
      results[provider.name] = await provider.test();
      console.log(`${provider.name}: ${results[provider.name] ? 'OK' : 'FAILED'}`);
    }

    return results;
  }

  private async validateWithOpenAI(openai: OpenAI, documentText: string, extractedData: any): Promise<ValidationResult> {
    const prompt = `
Você é um auditor financeiro especializado. Compare o documento original com os dados extraídos automaticamente:

DOCUMENTO ORIGINAL (primeiros 2000 caracteres):
${documentText.substring(0, 2000)}

DADOS EXTRAÍDOS PELO SISTEMA:
${JSON.stringify(extractedData, null, 2)}

INSTRUÇÕES:
1. Analise se as transações extraídas correspondem ao documento
2. Verifique precisão de datas, valores e descrições
3. Identifique transações perdidas ou incorretas
4. Score de 0-100 baseado na precisão geral
5. Liste discrepâncias específicas encontradas

Responda APENAS em formato JSON:
{
  "validationScore": número,
  "accuracy": {
    "transactions": número_0_100,
    "dates": número_0_100,
    "amounts": número_0_100,
    "descriptions": número_0_100
  },
  "discrepancies": ["lista", "de", "problemas"],
  "recommendations": ["lista", "de", "melhorias"]
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        documentName: extractedData.filename || 'Unknown',
        extractedData,
        validationScore: result.validationScore || 0,
        discrepancies: result.discrepancies || [],
        accuracy: result.accuracy || { transactions: 0, dates: 0, amounts: 0, descriptions: 0 },
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('OpenAI validation error:', error);
      return this.createErrorResult(extractedData);
    }
  }

  // Gemini validation removed for now

  private async validateWithXAI(xai: OpenAI, documentText: string, extractedData: any): Promise<ValidationResult> {
    const prompt = `
Compare este documento financeiro com os dados extraídos e avalie a precisão:

DOCUMENTO: ${documentText.substring(0, 2000)}
DADOS: ${JSON.stringify(extractedData, null, 2)}

Retorne JSON com score de validação, precisão por categoria e discrepâncias encontradas.`;

    try {
      const response = await xai.chat.completions.create({
        model: 'grok-2-1212',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        documentName: extractedData.filename || 'Unknown',
        extractedData,
        validationScore: result.validationScore || 0,
        discrepancies: result.discrepancies || [],
        accuracy: result.accuracy || { transactions: 0, dates: 0, amounts: 0, descriptions: 0 },
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('xAI validation error:', error);
      return this.createErrorResult(extractedData);
    }
  }

  private createErrorResult(extractedData: any): ValidationResult {
    return {
      documentName: extractedData.filename || 'Unknown',
      extractedData,
      validationScore: 0,
      discrepancies: ['Erro na validação automática'],
      accuracy: { transactions: 0, dates: 0, amounts: 0, descriptions: 0 },
      recommendations: ['Verificar conectividade com APIs de validação']
    };
  }

  async validateDocument(documentText: string, extractedData: any): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];
    
    for (const provider of this.providers) {
      console.log(`Validating with ${provider.name}...`);
      try {
        const result = await provider.validate(documentText, extractedData);
        results.push(result);
      } catch (error) {
        console.error(`Validation failed with ${provider.name}:`, error);
        results.push(this.createErrorResult(extractedData));
      }
    }

    return results;
  }

  async validateAllDocuments(): Promise<{ [filename: string]: ValidationResult[] }> {
    const documentsPath = 'attached_assets';
    const validationResults: { [filename: string]: ValidationResult[] } = {};

    // Lista dos PDFs para validar
    const pdfFiles = [
      'Nubank_2025-05-24_1751172520674.pdf',
      'PicPay_Fatura_042025_1751172520655.pdf',
      'InfinitePay 18-03-2025 a 17-06-2025_1751172372227.pdf',
      'extrato-f11d355d-584d-4b2d-a81a-01175304a322_1751172520692.pdf',
      'Extrato-15-03-2025-a-12-06-2025_1751172520575.pdf'
    ];

    for (const filename of pdfFiles) {
      console.log(`\n=== Validating ${filename} ===`);
      
      try {
        // Aqui integraria com o sistema existente de processamento
        // Por enquanto, simular dados extraídos
        const mockExtractedData = {
          filename,
          bank: 'detected_bank',
          transactions: [],
          metadata: {}
        };

        const mockDocumentText = `Documento ${filename} - conteúdo simulado para teste`;
        
        const results = await this.validateDocument(mockDocumentText, mockExtractedData);
        validationResults[filename] = results;
        
        console.log(`Validation completed for ${filename}`);
      } catch (error) {
        console.error(`Failed to validate ${filename}:`, error);
        validationResults[filename] = [this.createErrorResult({ filename })];
      }
    }

    return validationResults;
  }
}

export const documentValidator = new DocumentValidator();