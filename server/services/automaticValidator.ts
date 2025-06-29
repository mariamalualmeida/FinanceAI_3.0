import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileProcessor } from './fileProcessor';

interface DocumentValidation {
  filename: string;
  documentText: string;
  extractedData: any;
  validationResult: {
    overallScore: number; // 0-100
    accuracy: {
      bankDetection: number;
      transactionCount: number;
      dateAccuracy: number;
      valueAccuracy: number;
      descriptionAccuracy: number;
    };
    discrepancies: string[];
    recommendations: string[];
    llmProvider: string;
  };
}

class AutomaticValidator {
  private openai: OpenAI | null = null;
  private xai: OpenAI | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    if (process.env.XAI_API_KEY) {
      this.xai = new OpenAI({ 
        baseURL: "https://api.x.ai/v1", 
        apiKey: process.env.XAI_API_KEY 
      });
    }
  }

  async validateDocumentWithLLM(documentText: string, extractedData: any, provider: 'openai' | 'xai' = 'openai'): Promise<any> {
    const prompt = `
Você é um auditor financeiro especializado em validação de dados extraídos de documentos brasileiros.

TAREFA: Compare o documento original com os dados extraídos automaticamente e forneça uma análise detalhada.

DOCUMENTO ORIGINAL (primeiros 3000 caracteres):
${documentText.substring(0, 3000)}

DADOS EXTRAÍDOS PELO SISTEMA:
${JSON.stringify(extractedData, null, 2)}

INSTRUÇÕES ESPECÍFICAS:
1. Analise se o banco foi detectado corretamente
2. Verifique se todas as transações visíveis foram extraídas
3. Confirme a precisão de datas, valores e descrições
4. Identifique transações perdidas ou extraídas incorretamente
5. Avalie a categorização das transações
6. Score geral de 0-100 baseado na precisão total

Responda APENAS em formato JSON válido:
{
  "overallScore": number,
  "accuracy": {
    "bankDetection": number_0_100,
    "transactionCount": number_0_100,
    "dateAccuracy": number_0_100,
    "valueAccuracy": number_0_100,
    "descriptionAccuracy": number_0_100
  },
  "discrepancies": ["lista detalhada de problemas encontrados"],
  "recommendations": ["sugestões específicas para melhorar a extração"],
  "correctBank": "nome_do_banco_correto_se_diferente",
  "missingTransactions": number,
  "incorrectTransactions": number
}`;

    try {
      const client = provider === 'openai' ? this.openai : this.xai;
      const model = provider === 'openai' ? 'gpt-4o' : 'grok-2-1212';

      if (!client) {
        throw new Error(`${provider} client not available`);
      }

      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        ...result,
        llmProvider: provider
      };
    } catch (error) {
      console.error(`Validation error with ${provider}:`, error);
      return {
        overallScore: 0,
        accuracy: {
          bankDetection: 0,
          transactionCount: 0,
          dateAccuracy: 0,
          valueAccuracy: 0,
          descriptionAccuracy: 0
        },
        discrepancies: [`Erro na validação com ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Verificar conectividade com API'],
        llmProvider: provider,
        error: true
      };
    }
  }

  async processDocument(filename: string): Promise<DocumentValidation> {
    try {
      console.log(`\n=== Processando ${filename} ===`);
      
      // Ler arquivo
      const filePath = path.join('attached_assets', filename);
      const fileBuffer = await fs.readFile(filePath);
      
      // Processar documento
      const processedData = await fileProcessor.processFile(fileBuffer, filename);
      
      // Extrair texto para validação
      const documentText = processedData.text || '';
      
      console.log(`Documento processado - ${processedData.metadata?.transactions?.length || 0} transações extraídas`);
      console.log(`Banco detectado: ${processedData.metadata?.bank || 'Não detectado'}`);
      
      // Validar com LLM disponível
      let validationResult;
      if (this.openai) {
        console.log('Validando com OpenAI...');
        validationResult = await this.validateDocumentWithLLM(documentText, processedData, 'openai');
      } else if (this.xai) {
        console.log('Validando com xAI...');
        validationResult = await this.validateDocumentWithLLM(documentText, processedData, 'xai');
      } else {
        throw new Error('Nenhum provedor LLM disponível para validação');
      }

      return {
        filename,
        documentText: documentText.substring(0, 1000), // Apenas primeiros 1000 chars para log
        extractedData: processedData,
        validationResult
      };

    } catch (error) {
      console.error(`Erro ao processar ${filename}:`, error);
      return {
        filename,
        documentText: '',
        extractedData: {},
        validationResult: {
          overallScore: 0,
          accuracy: {
            bankDetection: 0,
            transactionCount: 0,
            dateAccuracy: 0,
            valueAccuracy: 0,
            descriptionAccuracy: 0
          },
          discrepancies: [`Erro no processamento: ${error instanceof Error ? error.message : 'Unknown error'}`],
          recommendations: ['Verificar formato do arquivo e sistema de processamento'],
          llmProvider: 'none'
        }
      };
    }
  }

  async validateAllDocuments(): Promise<DocumentValidation[]> {
    console.log('\n🔍 INICIANDO VALIDAÇÃO AUTOMÁTICA DOCUMENTO POR DOCUMENTO\n');

    // Lista dos documentos para validar
    const documentsToValidate = [
      'Nubank_2025-05-24_1751172520674.pdf',
      'PicPay_Fatura_042025_1751172520655.pdf', 
      'InfinitePay 18-03-2025 a 17-06-2025_1751172372227.pdf',
      'extrato-f11d355d-584d-4b2d-a81a-01175304a322_1751172520692.pdf',
      'Extrato-15-03-2025-a-12-06-2025_1751172520575.pdf',
      'Fatura_Itau_20250615-223237_1751172392910.pdf',
      'Fatura_Itau_20250615-223256_1751172392939.pdf'
    ];

    const results: DocumentValidation[] = [];

    for (const filename of documentsToValidate) {
      try {
        const validation = await this.processDocument(filename);
        results.push(validation);
        
        // Log resultado imediato
        console.log(`\n📊 RESULTADO ${filename}:`);
        console.log(`Score Geral: ${validation.validationResult.overallScore}/100`);
        console.log(`Banco detectado: ${validation.extractedData.metadata?.bank || 'N/A'}`);
        console.log(`Transações extraídas: ${validation.extractedData.metadata?.transactions?.length || 0}`);
        console.log(`Principais problemas: ${validation.validationResult.discrepancies.slice(0, 2).join(', ')}`);
        
      } catch (error) {
        console.error(`Falha crítica ao validar ${filename}:`, error);
        results.push({
          filename,
          documentText: '',
          extractedData: {},
          validationResult: {
            overallScore: 0,
            accuracy: {
              bankDetection: 0,
              transactionCount: 0,
              dateAccuracy: 0,
              valueAccuracy: 0,
              descriptionAccuracy: 0
            },
            discrepancies: ['Falha crítica no processamento'],
            recommendations: ['Verificar sistema de arquivos e processamento'],
            llmProvider: 'none'
          }
        });
      }
    }

    return results;
  }

  generateSummaryReport(validations: DocumentValidation[]): string {
    const totalDocs = validations.length;
    const avgScore = validations.reduce((sum, v) => sum + v.validationResult.overallScore, 0) / totalDocs;
    const successfulDocs = validations.filter(v => v.validationResult.overallScore > 50).length;
    
    const bankDetection = validations.reduce((sum, v) => sum + v.validationResult.accuracy.bankDetection, 0) / totalDocs;
    const transactionAccuracy = validations.reduce((sum, v) => sum + v.validationResult.accuracy.transactionCount, 0) / totalDocs;
    
    const allDiscrepancies = validations.flatMap(v => v.validationResult.discrepancies);
    const allRecommendations = validations.flatMap(v => v.validationResult.recommendations);

    return `
📈 RELATÓRIO FINAL DE VALIDAÇÃO AUTOMÁTICA

🎯 MÉTRICAS GERAIS:
• Documentos processados: ${totalDocs}
• Score médio geral: ${avgScore.toFixed(1)}/100
• Documentos com score > 50: ${successfulDocs}/${totalDocs} (${(successfulDocs/totalDocs*100).toFixed(1)}%)

🏦 PRECISÃO POR CATEGORIA:
• Detecção de banco: ${bankDetection.toFixed(1)}/100
• Extração de transações: ${transactionAccuracy.toFixed(1)}/100

📊 RESULTADOS POR DOCUMENTO:
${validations.map(v => 
  `• ${v.filename}: ${v.validationResult.overallScore}/100 - ${v.extractedData.metadata?.bank || 'N/A'} - ${v.extractedData.metadata?.transactions?.length || 0} transações`
).join('\n')}

⚠️ PRINCIPAIS PROBLEMAS IDENTIFICADOS:
${[...new Set(allDiscrepancies)].slice(0, 5).map(d => `• ${d}`).join('\n')}

💡 RECOMENDAÇÕES PRIORITÁRIAS:
${[...new Set(allRecommendations)].slice(0, 5).map(r => `• ${r}`).join('\n')}

🔧 PRÓXIMOS PASSOS:
• Ajustar parsers para bancos com score < 70
• Implementar melhorias sugeridas pelos LLMs
• Validar novamente após correções
`;
  }
}

export const automaticValidator = new AutomaticValidator();