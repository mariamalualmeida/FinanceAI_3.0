import { MultiLLMOrchestrator } from '../../shared/analysis/multi-llm-orchestrator';

interface ExtractedData {
  bank: string;
  accountHolder: string;
  period: string;
  transactions: Array<{
    date: string;
    description: string;
    amount: number;
    type: 'credit' | 'debit';
    category: string;
    balance?: number;
  }>;
  summary: {
    totalCredits: number;
    totalDebits: number;
    finalBalance: number;
    transactionCount: number;
  };
  extractionMethod: 'llm' | 'parser';
  confidence: number;
}

export class LLMExtractor {
  private orchestrator: MultiLLMOrchestrator;

  constructor() {
    this.orchestrator = new MultiLLMOrchestrator();
  }

  async extractFromDocument(documentText: string, fileName: string): Promise<ExtractedData> {
    console.log(`[LLMExtractor] Iniciando extração LLM para: ${fileName}`);
    
    try {
      // Prompt especializado para extração de dados financeiros brasileiros
      const extractionPrompt = this.buildExtractionPrompt(documentText, fileName);
      
      const response = await this.orchestrator.processRequest({
        query: extractionPrompt,
        context: {
          type: 'financial_extraction',
          document_type: this.detectDocumentType(fileName),
          bank_hint: this.detectBankFromText(documentText)
        },
        strategy: 'balanced' // Usar estratégia balanceada para extração
      });

      if (response.success && response.data) {
        const extractedData = this.parseExtractionResponse(response.data);
        console.log(`[LLMExtractor] ✅ Extração LLM bem-sucedida: ${extractedData.transactions.length} transações`);
        
        return {
          ...extractedData,
          extractionMethod: 'llm',
          confidence: response.confidence || 0.9
        };
      } else {
        throw new Error('LLM extraction failed');
      }
    } catch (error) {
      console.error('[LLMExtractor] ❌ Falha na extração LLM:', error);
      throw error;
    }
  }

  private buildExtractionPrompt(documentText: string, fileName: string): string {
    return `
# EXTRAÇÃO DE DADOS FINANCEIROS - DOCUMENTO BRASILEIRO

Analise este documento financeiro brasileiro e extraia TODOS os dados de forma estruturada e precisa.

## DOCUMENTO:
Nome do arquivo: ${fileName}
Conteúdo: ${documentText}

## INSTRUÇÕES DE EXTRAÇÃO:

### 1. IDENTIFICAÇÃO DO BANCO
- Detecte o banco/fintech exato (Nubank, PicPay, InfinitePay, Itaú, BB, Caixa, etc.)
- Use nomes oficiais, não abreviações

### 2. DADOS DO TITULAR
- Nome completo do titular da conta
- CPF/CNPJ se disponível

### 3. PERÍODO
- Data inicial e final do extrato/fatura
- Formato: DD/MM/AAAA

### 4. TRANSAÇÕES
Para CADA transação encontrada, extraia:
- Data (DD/MM/AAAA)
- Descrição completa (mantenha detalhes originais)
- Valor (número, sem formatação)
- Tipo: "credit" (entrada) ou "debit" (saída)
- Categoria: alimentação, transporte, compras, transferência, etc.
- Saldo após transação (se disponível)

### 5. RESUMO FINANCEIRO
- Total de créditos (entradas)
- Total de débitos (saídas)
- Saldo final
- Quantidade total de transações

## FORMATO DE RESPOSTA (JSON):
\`\`\`json
{
  "bank": "Nome do Banco",
  "accountHolder": "Nome do Titular",
  "period": "01/01/2025 a 31/01/2025",
  "transactions": [
    {
      "date": "15/01/2025",
      "description": "Descrição da transação",
      "amount": 150.75,
      "type": "debit",
      "category": "alimentação",
      "balance": 1000.50
    }
  ],
  "summary": {
    "totalCredits": 5000.00,
    "totalDebits": 3000.00,
    "finalBalance": 2000.00,
    "transactionCount": 45
  }
}
\`\`\`

IMPORTANTE:
- Extraia TODAS as transações visíveis no documento
- Mantenha descrições originais completas
- Use valores numéricos exatos (sem R$, vírgulas como separador)
- Categorize baseado no conteúdo da descrição
- Se algum dado não estiver disponível, use "N/A"

Responda APENAS com o JSON estruturado.
`;
  }

  private detectDocumentType(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes('fatura')) return 'invoice';
    if (name.includes('extrato')) return 'statement';
    if (name.includes('comprovante')) return 'receipt';
    return 'financial_document';
  }

  private detectBankFromText(text: string): string {
    const bankKeywords = {
      'nubank': ['nubank', 'nu banco', 'nu pagamentos'],
      'picpay': ['picpay', 'pic pay'],
      'infinitepay': ['infinitepay', 'infinite pay', 'leonardo de almeida santos'],
      'stone': ['stone', 'stone instituição'],
      'itau': ['itaú', 'itau', 'banco itaú'],
      'bb': ['banco do brasil', 'bb'],
      'caixa': ['caixa econômica', 'cef'],
      'santander': ['santander'],
      'bradesco': ['bradesco']
    };

    const lowerText = text.toLowerCase();
    for (const [bank, keywords] of Object.entries(bankKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return bank;
      }
    }
    return 'unknown';
  }

  private parseExtractionResponse(responseData: string): Omit<ExtractedData, 'extractionMethod' | 'confidence'> {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = responseData.match(/```json\n([\s\S]*?)\n```/) || 
                       responseData.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);

      // Validar estrutura mínima
      if (!parsed.transactions || !Array.isArray(parsed.transactions)) {
        throw new Error('Invalid transaction structure');
      }

      // Normalizar dados
      return {
        bank: parsed.bank || 'N/A',
        accountHolder: parsed.accountHolder || 'N/A',
        period: parsed.period || 'N/A',
        transactions: parsed.transactions.map((t: any) => ({
          date: t.date || 'N/A',
          description: t.description || 'N/A',
          amount: parseFloat(t.amount) || 0,
          type: t.type === 'credit' ? 'credit' : 'debit',
          category: t.category || 'outros',
          balance: t.balance ? parseFloat(t.balance) : undefined
        })),
        summary: {
          totalCredits: parseFloat(parsed.summary?.totalCredits) || 0,
          totalDebits: parseFloat(parsed.summary?.totalDebits) || 0,
          finalBalance: parseFloat(parsed.summary?.finalBalance) || 0,
          transactionCount: parseInt(parsed.summary?.transactionCount) || parsed.transactions.length
        }
      };
    } catch (error) {
      console.error('[LLMExtractor] Erro ao parsear resposta:', error);
      throw new Error('Failed to parse LLM response');
    }
  }
}