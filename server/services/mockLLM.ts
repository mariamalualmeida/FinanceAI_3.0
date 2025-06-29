/**
 * Mock LLM service para testes sem limitações de cota
 * Simula respostas de LLM para extração de dados financeiros
 */

export class MockLLMService {
  
  static async extractFinancialData(documentText: string, fileName: string): Promise<string> {
    console.log('[MockLLM] Simulando extração LLM para:', fileName);
    
    // Detectar banco baseado no texto
    const detectedBank = this.detectBankFromText(documentText, fileName);
    
    // Extrair transações simuladas baseadas no conteúdo real
    const transactions = this.extractTransactionsFromText(documentText);
    
    // Gerar resposta JSON simulada no formato esperado
    const mockResponse = {
      bank: detectedBank,
      accountHolder: this.extractAccountHolder(documentText),
      period: this.extractPeriod(documentText, fileName),
      transactions: transactions,
      summary: this.calculateSummary(transactions)
    };

    return `\`\`\`json
${JSON.stringify(mockResponse, null, 2)}
\`\`\``;
  }

  private static detectBankFromText(text: string, fileName: string): string {
    const content = (text + ' ' + fileName).toLowerCase();
    
    const bankPatterns = {
      'Nubank': ['nubank', 'nu banco', 'nu pagamentos', 'mastercard gold'],
      'PicPay': ['picpay', 'pic pay', 'cartão picpay'],
      'InfinitePay': ['infinitepay', 'infinite pay', 'leonardo de almeida santos'],
      'Stone': ['stone instituição', 'stone pagamentos'],
      'Itaú': ['itaú', 'itau unibanco', 'banco itaú'],
      'Banco do Brasil': ['banco do brasil', 'bb s.a'],
      'Caixa Econômica': ['caixa econômica', 'cef'],
      'Santander': ['santander brasil', 'banco santander'],
      'Bradesco': ['bradesco s.a', 'banco bradesco']
    };

    for (const [bank, patterns] of Object.entries(bankPatterns)) {
      if (patterns.some(pattern => content.includes(pattern))) {
        return bank;
      }
    }

    return 'Banco Detectado';
  }

  private static extractAccountHolder(text: string): string {
    const namePatterns = [
      /leonardo\s+[a-záàâãéêíóôõúç\s]*/i,
      /titular[:\s]+([a-záàâãéêíóôõúç\s]+)/i,
      /portador[:\s]+([a-záàâãéêíóôõúç\s]+)/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0].trim().toUpperCase();
      }
    }

    return 'LEONARDO DE ALMEIDA SANTOS';
  }

  private static extractPeriod(text: string, fileName: string): string {
    const datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})\s*a\s*(\d{2}\/\d{2}\/\d{4})/,
      /(\d{2}-\d{2}-\d{4})\s*a\s*(\d{2}-\d{2}-\d{4})/,
      /2025-05-24/,
      /2025/
    ];

    const content = text + ' ' + fileName;
    
    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        if (match[1] && match[2]) {
          return `${match[1]} a ${match[2]}`;
        }
      }
    }

    // Deduzir período baseado no nome do arquivo
    if (fileName.includes('2025-05')) {
      return '01/05/2025 a 31/05/2025';
    }
    if (fileName.includes('042025')) {
      return '01/04/2025 a 30/04/2025';
    }
    if (fileName.includes('2025')) {
      return '01/03/2025 a 30/06/2025';
    }

    return '01/01/2025 a 31/12/2025';
  }

  private static extractTransactionsFromText(text: string): any[] {
    const transactions = [];
    
    // Simular transações baseadas no conteúdo
    const lines = text.split('\n').filter(line => line.trim().length > 5);
    
    let transactionCount = 0;
    const maxTransactions = 50;
    
    for (const line of lines) {
      if (transactionCount >= maxTransactions) break;
      
      // Buscar padrões de data e valor
      const datePattern = /(\d{2})[\/\-](\d{2})[\/\-](\d{4}|\d{2})/;
      const valuePattern = /[\d.,]+/g;
      
      if (datePattern.test(line)) {
        const dateMatch = line.match(datePattern);
        const values = line.match(valuePattern);
        
        if (dateMatch && values && values.length > 0) {
          const amount = this.parseAmount(values[values.length - 1]);
          
          if (amount > 0 && amount < 100000) {
            transactions.push({
              date: `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3]}`,
              description: this.generateDescription(line, transactionCount),
              amount: amount,
              type: this.determineType(line, amount),
              category: this.categorizeTransaction(line),
              balance: amount * (Math.random() * 10 + 1)
            });
            transactionCount++;
          }
        }
      }
    }

    // Se não encontrou transações, gerar algumas simuladas
    if (transactions.length === 0) {
      const simulatedTransactions = [
        {
          date: '15/05/2025',
          description: 'PIX RECEBIDO',
          amount: 1500.00,
          type: 'credit',
          category: 'transferência',
          balance: 2500.00
        },
        {
          date: '16/05/2025',
          description: 'COMPRA CARTÃO',
          amount: 89.90,
          type: 'debit',
          category: 'compras',
          balance: 2410.10
        },
        {
          date: '17/05/2025',
          description: 'TRANSFERÊNCIA PIX',
          amount: 200.00,
          type: 'debit',
          category: 'transferência',
          balance: 2210.10
        }
      ];
      transactions.push(...simulatedTransactions);
    }

    return transactions.slice(0, 30); // Limitar para performance
  }

  private static parseAmount(amountStr: string): number {
    return parseFloat(
      amountStr
        .replace(/[^\d,.-]/g, '')
        .replace(',', '.')
    ) || 0;
  }

  private static generateDescription(line: string, index: number): string {
    const descriptions = [
      'PIX TRANSFERÊNCIA',
      'COMPRA DÉBITO',
      'SAQUE ELETRÔNICO',
      'DEPÓSITO',
      'PAGAMENTO CONTA',
      'TRANSFERÊNCIA TED',
      'COMPRA CARTÃO',
      'RECEBIMENTO PIX'
    ];
    
    // Tentar extrair descrição da linha
    const cleanLine = line.replace(/\d+[\/\-]\d+[\/\-]\d+/g, '').replace(/[\d.,]+/g, '').trim();
    
    if (cleanLine.length > 5 && cleanLine.length < 50) {
      return cleanLine.toUpperCase();
    }
    
    return descriptions[index % descriptions.length];
  }

  private static determineType(line: string, amount: number): 'credit' | 'debit' {
    const creditKeywords = ['deposito', 'credito', 'recebimento', 'pix recebido'];
    const debitKeywords = ['saque', 'pagamento', 'compra', 'debito', 'pix enviado'];
    
    const lowerLine = line.toLowerCase();
    
    if (creditKeywords.some(keyword => lowerLine.includes(keyword))) {
      return 'credit';
    }
    if (debitKeywords.some(keyword => lowerLine.includes(keyword))) {
      return 'debit';
    }
    
    // Por padrão, valores pequenos são débitos, grandes são créditos
    return amount > 500 ? 'credit' : 'debit';
  }

  private static categorizeTransaction(line: string): string {
    const categories = {
      'alimentação': ['restaurante', 'lanchonete', 'food', 'mercado'],
      'transporte': ['uber', 'taxi', 'combustivel', 'posto'],
      'compras': ['loja', 'magazine', 'shopping'],
      'transferência': ['pix', 'ted', 'doc', 'transferencia'],
      'saúde': ['farmacia', 'medico', 'hospital'],
      'entretenimento': ['netflix', 'spotify', 'cinema']
    };

    const lowerLine = line.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowerLine.includes(keyword))) {
        return category;
      }
    }
    
    return 'outros';
  }

  private static calculateSummary(transactions: any[]) {
    const credits = transactions.filter(t => t.type === 'credit');
    const debits = transactions.filter(t => t.type === 'debit');
    
    const totalCredits = credits.reduce((sum, t) => sum + t.amount, 0);
    const totalDebits = debits.reduce((sum, t) => sum + t.amount, 0);
    
    return {
      totalCredits: Math.round(totalCredits * 100) / 100,
      totalDebits: Math.round(totalDebits * 100) / 100,
      finalBalance: Math.round((totalCredits - totalDebits) * 100) / 100,
      transactionCount: transactions.length
    };
  }
}