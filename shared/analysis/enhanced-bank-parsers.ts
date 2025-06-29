interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  bank?: string;
  balance?: number;
  confidence?: number;
}

interface BankDetectionResult {
  bank: string;
  bankName: string;
  confidence: number;
  method: string;
}

interface BankParser {
  detectBank(content: string): BankDetectionResult;
  parseTransactions(content: string, bankCode: string): Transaction[];
}

interface BankParsingRule {
  name: string;
  patterns: {
    identifier: RegExp[];
    transaction: RegExp;
    date: RegExp;
    amount: RegExp;
    description: RegExp;
  };
  dateFormat: string;
  categories: Record<string, string[]>;
}

export class EnhancedBankParsers {
  private rules: Record<string, BankParsingRule> = {
    nubank: {
      name: 'Nubank',
      patterns: {
        identifier: [/nubank/i, /roxinho/i, /nu\s*bank/i],
        transaction: /(\d{2}\/\d{2})\s+(.+?)\s+(R\$\s*[\d.,]+)/g,
        date: /(\d{2}\/\d{2})/,
        amount: /R\$\s*([\d.,]+)/,
        description: /\d{2}\/\d{2}\s+(.+?)\s+R\$/
      },
      dateFormat: 'DD/MM',
      categories: {
        'Alimentação': ['restaurante', 'lanchonete', 'delivery', 'ifood', 'uber eats'],
        'Transporte': ['uber', '99', 'metro', 'onibus', 'combustivel', 'posto'],
        'Compras': ['mercado', 'farmacia', 'loja', 'shopping', 'amazon'],
        'Entretenimento': ['cinema', 'netflix', 'spotify', 'youtube', 'jogo'],
        'Saúde': ['hospital', 'clinica', 'medico', 'laboratorio', 'dentista']
      }
    },
    
    itau: {
      name: 'Itaú',
      patterns: {
        identifier: [/itau/i, /itaú/i, /banco\s*itau/i],
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?[\d.,]+)/g,
        date: /(\d{2}\/\d{2}\/\d{4})/,
        amount: /([-]?[\d.,]+)/,
        description: /\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+[-]?[\d.,]+/
      },
      dateFormat: 'DD/MM/YYYY',
      categories: {
        'Transferências': ['ted', 'doc', 'pix', 'transferencia'],
        'Pagamentos': ['conta', 'fatura', 'boleto', 'debito automatico'],
        'Saques': ['saque', 'atm', 'caixa eletronico'],
        'Tarifas': ['tarifa', 'taxa', 'anuidade', 'manutencao']
      }
    },
    
    bradesco: {
      name: 'Bradesco',
      patterns: {
        identifier: [/bradesco/i, /banco\s*bradesco/i],
        transaction: /(\d{2}\/\d{2})\s+(\d{2}\/\d{2})\s+(.+?)\s+([-]?[\d.,]+)/g,
        date: /(\d{2}\/\d{2})/,
        amount: /([-]?[\d.,]+)/,
        description: /\d{2}\/\d{2}\s+\d{2}\/\d{2}\s+(.+?)\s+[-]?[\d.,]+/
      },
      dateFormat: 'DD/MM',
      categories: {
        'Cartão': ['compra', 'mastercard', 'visa', 'elo'],
        'Investimentos': ['aplicacao', 'resgate', 'cdb', 'poupanca'],
        'Seguros': ['seguro', 'previdencia', 'capitalizacao']
      }
    },
    
    santander: {
      name: 'Santander',
      patterns: {
        identifier: [/santander/i, /banco\s*santander/i],
        transaction: /(\d{2}\/\d{2}\/\d{2})\s+(.+?)\s+([-]?[\d.,]+)/g,
        date: /(\d{2}\/\d{2}\/\d{2})/,
        amount: /([-]?[\d.,]+)/,
        description: /\d{2}\/\d{2}\/\d{2}\s+(.+?)\s+[-]?[\d.,]+/
      },
      dateFormat: 'DD/MM/YY',
      categories: {
        'Internacional': ['internacional', 'exterior', 'usd', 'eur'],
        'Investimentos': ['van gogh', 'select', 'private']
      }
    },
    
    caixa: {
      name: 'Caixa Econômica Federal',
      patterns: {
        identifier: [/caixa/i, /cef/i, /economica/i],
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?[\d.,]+)/g,
        date: /(\d{2}\/\d{2}\/\d{4})/,
        amount: /([-]?[\d.,]+)/,
        description: /\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+[-]?[\d.,]+/
      },
      dateFormat: 'DD/MM/YYYY',
      categories: {
        'Governo': ['auxilio', 'beneficio', 'fgts', 'pis', 'governo'],
        'Financiamento': ['habitacao', 'imovel', 'financiamento']
      }
    },
    
    picpay: {
      name: 'PicPay',
      patterns: {
        identifier: [/picpay/i, /pic\s*pay/i],
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?R\$\s*[\d.,]+)/g,
        date: /(\d{2}\/\d{2}\/\d{4})/,
        amount: /R\$\s*([-]?[\d.,]+)/,
        description: /\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+[-]?R\$/
      },
      dateFormat: 'DD/MM/YYYY',
      categories: {
        'Digital': ['recarga', 'celular', 'streaming', 'app'],
        'Cashback': ['cashback', 'desconto', 'promocao']
      }
    },
    
    infinitepay: {
      name: 'InfinitePay',
      patterns: {
        identifier: [/infinitepay/i, /infinite\s*pay/i],
        transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-]?[\d.,]+)/g,
        date: /(\d{2}\/\d{2}\/\d{4})/,
        amount: /([-]?[\d.,]+)/,
        description: /\d{2}\/\d{2}\/\d{4}\s+(.+?)\s+[-]?[\d.,]+/
      },
      dateFormat: 'DD/MM/YYYY',
      categories: {
        'Vendas': ['venda', 'recebimento', 'maquininha'],
        'Taxas': ['taxa', 'comissao', 'antecipacao']
      }
    }
  };

  detectBank(content: string): BankDetectionResult {
    const contentLower = content.toLowerCase();
    
    for (const [bankCode, rule] of Object.entries(this.rules)) {
      for (const pattern of rule.patterns.identifier) {
        if (pattern.test(contentLower)) {
          return {
            bank: bankCode,
            bankName: rule.name,
            confidence: 0.95,
            method: 'enhanced_parser'
          };
        }
      }
    }
    
    return {
      bank: 'unknown',
      bankName: 'Banco não identificado',
      confidence: 0.1,
      method: 'fallback'
    };
  }

  parseTransactions(content: string, bankCode: string): Transaction[] {
    const rule = this.rules[bankCode];
    if (!rule) {
      return this.fallbackParsing(content);
    }

    const transactions: Transaction[] = [];
    let match;
    const regex = new RegExp(rule.patterns.transaction.source, 'g');
    
    while ((match = regex.exec(content)) !== null) {
      const dateMatch = match[1];
      const description = match[2]?.trim();
      const amountStr = match[3];

      if (!dateMatch || !description || !amountStr) continue;

      const amount = this.parseAmount(amountStr);
      const type = amount >= 0 ? 'credit' : 'debit';
      const category = this.categorizeTransaction(description, rule.categories);

      transactions.push({
        date: this.formatDate(dateMatch, rule.dateFormat),
        description: this.cleanDescription(description),
        amount: Math.abs(amount),
        type,
        category,
        bank: rule.name
      });
    }

    return transactions;
  }

  private parseAmount(amountStr: string): number {
    // Remove R$, espaços e converte vírgula para ponto
    const cleaned = amountStr
      .replace(/R\$\s*/g, '')
      .replace(/\./g, '')
      .replace(/,/g, '.')
      .trim();
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private formatDate(dateStr: string, format: string): string {
    const currentYear = new Date().getFullYear();
    
    switch (format) {
      case 'DD/MM':
        return `${dateStr}/${currentYear}`;
      case 'DD/MM/YY':
        const [day, month, year] = dateStr.split('/');
        const fullYear = parseInt(year) + 2000;
        return `${day}/${month}/${fullYear}`;
      case 'DD/MM/YYYY':
      default:
        return dateStr;
    }
  }

  private cleanDescription(description: string): string {
    return description
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-]/g, '')
      .trim()
      .substring(0, 100);
  }

  private categorizeTransaction(description: string, categories: Record<string, string[]>): string {
    const descLower = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (descLower.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }
    
    return 'Outros';
  }

  private fallbackParsing(content: string): Transaction[] {
    // Parser genérico como fallback
    const transactions: Transaction[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const dateMatch = line.match(/(\d{2}\/\d{2}(?:\/\d{2,4})?)/);
      const amountMatch = line.match(/(?:R\$\s*)?([-]?[\d.,]+)/);
      
      if (dateMatch && amountMatch) {
        const amount = this.parseAmount(amountMatch[0]);
        
        transactions.push({
          date: dateMatch[1],
          description: line.replace(dateMatch[0], '').replace(amountMatch[0], '').trim(),
          amount: Math.abs(amount),
          type: amount >= 0 ? 'credit' : 'debit',
          category: 'Geral'
        });
      }
    }
    
    return transactions;
  }

  getAvailableBanks(): string[] {
    return Object.keys(this.rules);
  }

  getBankInfo(bankCode: string): BankParsingRule | null {
    return this.rules[bankCode] || null;
  }
}

export const enhancedBankParsers = new EnhancedBankParsers();