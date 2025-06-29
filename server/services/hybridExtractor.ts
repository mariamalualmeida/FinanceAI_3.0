import { LLMExtractor } from './llmExtractor';
import { FileProcessor } from './fileProcessor';

interface ExtractionResult {
  success: boolean;
  data: {
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
    accuracyWarning?: string;
  };
  error?: string;
}

export class HybridExtractor {
  private llmExtractor: LLMExtractor;
  private fileProcessor: FileProcessor;

  constructor() {
    this.llmExtractor = new LLMExtractor();
    this.fileProcessor = new FileProcessor();
  }

  async extractFromDocument(filePath: string, fileName: string): Promise<ExtractionResult> {
    console.log(`[HybridExtractor] Iniciando extração híbrida para: ${fileName}`);

    try {
      // 1. PRIMEIRA TENTATIVA: LLM (método principal)
      console.log('[HybridExtractor] 🤖 Tentando extração com LLM...');
      
      const documentText = await this.extractTextFromFile(filePath);
      
      try {
        const llmResult = await this.llmExtractor.extractFromDocument(documentText, fileName);
        
        // Validar qualidade da extração LLM
        if (this.isGoodExtractionResult(llmResult)) {
          console.log('[HybridExtractor] ✅ Extração LLM bem-sucedida e de alta qualidade');
          return {
            success: true,
            data: {
              ...llmResult,
              extractionMethod: 'llm',
              confidence: llmResult.confidence
            }
          };
        } else {
          console.log('[HybridExtractor] ⚠️ Extração LLM de baixa qualidade, tentando parser...');
        }
      } catch (llmError) {
        console.log('[HybridExtractor] ❌ LLM falhou, tentando parser de backup:', llmError);
      }

      // 2. FALLBACK: Parser tradicional
      console.log('[HybridExtractor] 🔧 Usando parser tradicional como fallback...');
      
      const parserResult = await this.extractWithParser(filePath, fileName, documentText);
      
      return {
        success: true,
        data: {
          ...parserResult,
          extractionMethod: 'parser',
          confidence: 0.4, // Menor confiança para parsers
          accuracyWarning: '⚠️ Dados extraídos sem IA - Precisão limitada. Para melhor qualidade, configure uma API de IA nas configurações.'
        }
      };

    } catch (error) {
      console.error('[HybridExtractor] ❌ Falha em ambos os métodos:', error);
      return {
        success: false,
        error: `Falha na extração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        data: this.getEmptyResult()
      };
    }
  }

  private async extractTextFromFile(filePath: string): Promise<string> {
    // Usar método existente do FileProcessor para extrair texto
    const fs = require('fs');
    const path = require('path');
    
    if (filePath.toLowerCase().endsWith('.pdf')) {
      // Para PDFs, usar extração Python se disponível
      try {
        const { spawn } = require('child_process');
        return new Promise((resolve, reject) => {
          const python = spawn('python3', ['-c', `
import PyPDF2
import sys

try:
    with open('${filePath}', 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\\n'
        print(text)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
`]);
          
          let output = '';
          let error = '';
          
          python.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          python.stderr.on('data', (data) => {
            error += data.toString();
          });
          
          python.on('close', (code) => {
            if (code === 0) {
              resolve(output.trim());
            } else {
              reject(new Error(`PDF extraction failed: ${error}`));
            }
          });
        });
      } catch (error) {
        console.error('Fallback to basic text extraction');
        return fs.readFileSync(filePath, 'utf8').substring(0, 5000);
      }
    } else {
      // Para outros formatos, ler como texto
      return fs.readFileSync(filePath, 'utf8').substring(0, 5000);
    }
  }

  private async extractWithParser(filePath: string, fileName: string, documentText: string): Promise<any> {
    console.log('[HybridExtractor] Executando parser brasileiro...');
    
    // Detectar banco usando texto
    const detectedBank = this.detectBankFromContent(documentText, fileName);
    console.log(`[HybridExtractor] Banco detectado: ${detectedBank}`);

    // Usar parser específico baseado no banco
    const transactions = this.parseTransactionsFromText(documentText, detectedBank);
    
    return {
      bank: detectedBank || 'Banco não identificado',
      accountHolder: this.extractAccountHolder(documentText),
      period: this.extractPeriod(documentText, fileName),
      transactions: transactions,
      summary: this.calculateSummary(transactions)
    };
  }

  private detectBankFromContent(text: string, fileName: string): string {
    const content = (text + ' ' + fileName).toLowerCase();
    
    // Detecção melhorada baseada em conteúdo
    const bankPatterns = {
      'Nubank': ['nubank', 'nu banco', 'nu pagamentos', 'roxinho'],
      'PicPay': ['picpay', 'pic pay', 'cartão picpay'],
      'InfinitePay': ['infinitepay', 'infinite pay', 'leonardo de almeida santos'],
      'Stone': ['stone instituição', 'stone pagamentos'],
      'Itaú': ['itaú', 'itau unibanco', 'banco itaú'],
      'Banco do Brasil': ['banco do brasil', 'bb s.a'],
      'Caixa Econômica': ['caixa econômica', 'cef'],
      'Santander': ['santander brasil', 'banco santander'],
      'Bradesco': ['bradesco s.a', 'banco bradesco'],
      'Inter': ['banco inter', 'inter s.a'],
      'C6 Bank': ['c6 bank', 'banco c6'],
      'Original': ['banco original', 'original s.a']
    };

    for (const [bank, patterns] of Object.entries(bankPatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        return bank;
      }
    }

    return 'Não identificado';
  }

  private extractAccountHolder(text: string): string {
    // Buscar padrões de nome de titular
    const namePatterns = [
      /titular[:\s]+([a-záàâãéêíóôõúç\s]+)/i,
      /portador[:\s]+([a-záàâãéêíóôõúç\s]+)/i,
      /leonardo\s+[a-záàâãéêíóôõúç\s]*/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1].trim().toUpperCase().substring(0, 50);
      }
    }

    return 'Não identificado';
  }

  private extractPeriod(text: string, fileName: string): string {
    // Buscar período em diferentes formatos
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})\s*a\s*(\d{2}\/\d{2}\/\d{4})/,
      /período[:\s]*(\d{2}\/\d{2}\/\d{4})[^\d]*(\d{2}\/\d{2}\/\d{4})/i,
      /de\s+(\d{2}\/\d{2}\/\d{4})\s+até\s+(\d{2}\/\d{2}\/\d{4})/i
    ];

    const content = text + ' ' + fileName;
    
    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        return `${match[1]} a ${match[2]}`;
      }
    }

    return 'Período não identificado';
  }

  private parseTransactionsFromText(text: string, bank: string): any[] {
    console.log(`[HybridExtractor] Parseando transações para ${bank}...`);
    
    const transactions: any[] = [];
    const lines = text.split('\n');

    // Parser básico que funciona para vários formatos
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Buscar padrões de transação
      const transactionPatterns = [
        // Formato: DD/MM/YYYY descrição valor
        /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([\d.,]+)/,
        // Formato: DD/MM descrição valor
        /(\d{2}\/\d{2})\s+(.+?)\s+([\d.,]+)/
      ];

      for (const pattern of transactionPatterns) {
        const match = line.match(pattern);
        if (match) {
          const [, date, description, amountStr] = match;
          const amount = this.parseAmount(amountStr);
          
          if (amount > 0) {
            transactions.push({
              date: date.includes('/') && date.length > 5 ? date : `${date}/2025`,
              description: description.trim(),
              amount: amount,
              type: this.determineTransactionType(description, line),
              category: this.categorizeTransaction(description),
              balance: undefined
            });
          }
        }
      }
    }

    console.log(`[HybridExtractor] ${transactions.length} transações encontradas`);
    return transactions.slice(0, 100); // Limitar para evitar spam
  }

  private parseAmount(amountStr: string): number {
    // Converter string de valor para número
    return parseFloat(
      amountStr
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.')
    ) || 0;
  }

  private determineTransactionType(description: string, fullLine: string): 'credit' | 'debit' {
    const creditKeywords = ['deposito', 'credito', 'recebimento', 'entrada', 'pix recebido'];
    const debitKeywords = ['debito', 'pagamento', 'compra', 'saque', 'pix enviado'];
    
    const text = (description + ' ' + fullLine).toLowerCase();
    
    if (creditKeywords.some(keyword => text.includes(keyword))) {
      return 'credit';
    }
    if (debitKeywords.some(keyword => text.includes(keyword))) {
      return 'debit';
    }
    
    // Por padrão, assumir débito
    return 'debit';
  }

  private categorizeTransaction(description: string): string {
    const categories = {
      'alimentação': ['restaurante', 'lanchonete', 'ifood', 'uber eats', 'food'],
      'transporte': ['uber', 'taxi', 'metro', 'onibus', 'combustivel'],
      'compras': ['loja', 'magazine', 'mercado', 'supermercado'],
      'transferência': ['pix', 'ted', 'doc', 'transferencia'],
      'entretenimento': ['netflix', 'spotify', 'cinema', 'show'],
      'saúde': ['farmacia', 'medico', 'hospital', 'clinica'],
      'educação': ['escola', 'faculdade', 'curso', 'livro']
    };

    const desc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category;
      }
    }
    
    return 'outros';
  }

  private calculateSummary(transactions: any[]) {
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');
    
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalCredits,
      totalDebits,
      finalBalance: totalCredits - totalDebits,
      transactionCount: transactions.length
    };
  }

  private isGoodExtractionResult(result: any): boolean {
    // Critérios para considerar uma extração LLM como boa
    return (
      result.transactions &&
      result.transactions.length > 0 &&
      result.bank !== 'N/A' &&
      result.bank !== 'Não identificado' &&
      result.confidence > 0.7
    );
  }

  private getEmptyResult(): any {
    return {
      bank: 'Erro na extração',
      accountHolder: 'N/A',
      period: 'N/A',
      transactions: [],
      summary: {
        totalCredits: 0,
        totalDebits: 0,
        finalBalance: 0,
        transactionCount: 0
      },
      extractionMethod: 'parser',
      confidence: 0
    };
  }
}