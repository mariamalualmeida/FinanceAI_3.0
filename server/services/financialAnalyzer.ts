import { ProcessedDocument } from './fileProcessor';

export interface FinancialAnalysisResult {
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  bettingDetection: {
    detected: boolean;
    transactionCount: number;
    totalAmount: number;
    details: string[];
  };
  riskIndicators: {
    inconsistentIncome: boolean;
    highExpenseRatio: boolean;
    negativeBalance: boolean;
    unusualTransactions: boolean;
    bettingActivity: boolean;
  };
  categoryBreakdown: Record<string, { count: number; amount: number }>;
  recommendations: string[];
  alerts: string[];
}

export class FinancialAnalyzer {
  private bettingSites = [
    'bet365', 'betano', 'sportingbet', '1xbet', 'rivalo', 'betfair', 'betway', 'bodog',
    'betnacional', 'pixbet', 'parimatch', 'bet7k', 'esportes da sorte', 'casa de apostas',
    'aposta ganha', 'blaze', 'stake', 'bc.game', 'betmotion', 'bet7', 'onabet', 'mr.bet',
    'brazino777', 'betboo', 'netbet', 'sportsbet.io', 'dafabet', 'pinnacle', 'betsson',
    'casino', 'cassino', 'slots', 'bingo', 'loteria', 'rifa', 'sorte', 'gambling', 'poker'
  ];

  private legitimateProcessors = [
    'mercado pago', 'pag seguro', 'stone', 'cielo', 'rede', 'getnet', 'bin',
    'paypal', 'nubank', 'c6 bank', 'inter', 'banco do brasil', 'bradesco',
    'itau', 'santander', 'caixa', 'sicredi', 'sicoob', 'original', 'neon',
    'picpay', 'pagseguro', 'credito', 'seguros', 'previdencia'
  ];

  analyzeFinancialDocument(document: ProcessedDocument): FinancialAnalysisResult {
    const transactions = document.metadata.transactions || [];
    
    if (transactions.length === 0) {
      return this.createEmptyAnalysis();
    }

    // Calculate basic financial metrics
    const totalIncome = transactions
      .filter(t => t.value > 0)
      .reduce((sum, t) => sum + t.value, 0);

    const totalExpenses = transactions
      .filter(t => t.value < 0)
      .reduce((sum, t) => sum + Math.abs(t.value), 0);

    const netBalance = totalIncome - totalExpenses;

    // Detect betting activities
    const bettingDetection = this.detectBettingActivity(transactions);

    // Calculate credit score
    const creditScore = this.calculateCreditScore(transactions, {
      totalIncome,
      totalExpenses,
      netBalance,
      bettingDetection
    });

    // Determine risk level
    const riskLevel = this.determineRiskLevel(creditScore, bettingDetection, totalIncome, totalExpenses);

    // Identify risk indicators
    const riskIndicators = this.identifyRiskIndicators(transactions, totalIncome, totalExpenses, bettingDetection);

    // Categorize transactions
    const categoryBreakdown = this.categorizeTransactions(transactions);

    // Generate recommendations and alerts
    const recommendations = this.generateRecommendations(riskIndicators, creditScore, bettingDetection);
    const alerts = this.generateAlerts(riskIndicators, bettingDetection, transactions);

    return {
      creditScore,
      riskLevel,
      totalIncome,
      totalExpenses,
      netBalance,
      transactionCount: transactions.length,
      bettingDetection,
      riskIndicators,
      categoryBreakdown,
      recommendations,
      alerts
    };
  }

  private createEmptyAnalysis(): FinancialAnalysisResult {
    return {
      creditScore: 300,
      riskLevel: 'high',
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      transactionCount: 0,
      bettingDetection: {
        detected: false,
        transactionCount: 0,
        totalAmount: 0,
        details: []
      },
      riskIndicators: {
        inconsistentIncome: false,
        highExpenseRatio: false,
        negativeBalance: false,
        unusualTransactions: false,
        bettingActivity: false
      },
      categoryBreakdown: {},
      recommendations: ['Não foi possível analisar os dados financeiros'],
      alerts: ['Nenhuma transação encontrada para análise']
    };
  }

  private detectBettingActivity(transactions: any[]): FinancialAnalysisResult['bettingDetection'] {
    const bettingTransactions: any[] = [];
    let totalAmount = 0;

    transactions.forEach(transaction => {
      const description = transaction.description?.toLowerCase() || '';
      
      // Check for betting sites
      const isBettingSite = this.bettingSites.some(site => description.includes(site));
      
      // Check if it's not a legitimate processor
      const isLegitimateProcessor = this.legitimateProcessors.some(proc => description.includes(proc));
      
      if (isBettingSite && !isLegitimateProcessor) {
        bettingTransactions.push(transaction);
        totalAmount += Math.abs(transaction.value);
      }
    });

    return {
      detected: bettingTransactions.length > 0,
      transactionCount: bettingTransactions.length,
      totalAmount,
      details: bettingTransactions.map(t => `${t.description}: R$ ${Math.abs(t.value).toFixed(2)}`)
    };
  }

  private calculateCreditScore(transactions: any[], metrics: any): number {
    let score = 500; // Base score

    // Income consistency (20% weight)
    const incomeTransactions = transactions.filter(t => t.value > 0);
    if (incomeTransactions.length > 1) {
      const incomes = incomeTransactions.map(t => t.value);
      const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
      const variance = incomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / incomes.length;
      const stdDev = Math.sqrt(variance);
      const cv = stdDev / mean;
      
      if (cv < 0.2) score += 100;
      else if (cv < 0.4) score += 80;
      else if (cv < 0.6) score += 60;
      else score += 20;
    }

    // Expense control (20% weight)
    if (metrics.totalIncome > 0) {
      const expenseRatio = metrics.totalExpenses / metrics.totalIncome;
      if (expenseRatio < 0.5) score += 100;
      else if (expenseRatio < 0.7) score += 80;
      else if (expenseRatio < 0.9) score += 60;
      else if (expenseRatio < 1.0) score += 40;
      else score -= 50;
    }

    // Transaction frequency (15% weight)
    if (transactions.length > 20) score += 75;
    else if (transactions.length > 10) score += 50;
    else if (transactions.length > 5) score += 25;

    // Betting penalty (25% weight)
    if (metrics.bettingDetection.detected) {
      const bettingRatio = metrics.bettingDetection.totalAmount / metrics.totalExpenses;
      const penalty = Math.min(200, bettingRatio * 300 + metrics.bettingDetection.transactionCount * 15);
      score -= penalty;
    }

    // Balance consistency (10% weight)
    let runningBalance = 0;
    let negativeBalanceCount = 0;
    
    transactions.forEach(transaction => {
      runningBalance += transaction.value;
      if (runningBalance < 0) negativeBalanceCount++;
    });

    if (negativeBalanceCount === 0) score += 50;
    else if (negativeBalanceCount < transactions.length * 0.1) score += 30;
    else if (negativeBalanceCount > transactions.length * 0.5) score -= 30;

    // Activity level (10% weight)
    const daySpan = this.calculateDaySpan(transactions);
    if (daySpan > 60) score += 50;
    else if (daySpan > 30) score += 30;
    else if (daySpan > 7) score += 15;

    return Math.max(300, Math.min(850, Math.round(score)));
  }

  private calculateDaySpan(transactions: any[]): number {
    if (transactions.length < 2) return 0;
    
    const dates = transactions
      .map(t => new Date(t.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());
    
    if (dates.length < 2) return 0;
    
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    
    return Math.ceil((lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  private determineRiskLevel(
    creditScore: number, 
    bettingDetection: any, 
    totalIncome: number, 
    totalExpenses: number
  ): 'low' | 'medium' | 'high' {
    if (creditScore >= 720 && !bettingDetection.detected && totalIncome > totalExpenses) {
      return 'low';
    } else if (creditScore >= 600 && bettingDetection.transactionCount <= 2) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  private identifyRiskIndicators(transactions: any[], totalIncome: number, totalExpenses: number, bettingDetection: any) {
    const incomeTransactions = transactions.filter(t => t.value > 0);
    
    // Check for income inconsistency
    let inconsistentIncome = false;
    if (incomeTransactions.length > 1) {
      const incomes = incomeTransactions.map(t => t.value);
      const mean = incomes.reduce((a, b) => a + b, 0) / incomes.length;
      const variance = incomes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / incomes.length;
      const cv = Math.sqrt(variance) / mean;
      inconsistentIncome = cv > 0.5;
    }

    // Check for high expense ratio
    const highExpenseRatio = totalIncome > 0 && (totalExpenses / totalIncome) > 0.8;

    // Check for negative balance periods
    let runningBalance = 0;
    let hasNegativeBalance = false;
    transactions.forEach(transaction => {
      runningBalance += transaction.value;
      if (runningBalance < 0) hasNegativeBalance = true;
    });

    // Check for unusual transactions (very high amounts)
    const amounts = transactions.map(t => Math.abs(t.value));
    const meanAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const unusualTransactions = amounts.some(amount => amount > meanAmount * 5);

    return {
      inconsistentIncome,
      highExpenseRatio,
      negativeBalance: hasNegativeBalance,
      unusualTransactions,
      bettingActivity: bettingDetection.detected
    };
  }

  private categorizeTransactions(transactions: any[]): Record<string, { count: number; amount: number }> {
    const categories: Record<string, { count: number; amount: number }> = {};

    transactions.forEach(transaction => {
      const category = this.categorizeTransaction(transaction.description);
      
      if (!categories[category]) {
        categories[category] = { count: 0, amount: 0 };
      }
      
      categories[category].count++;
      categories[category].amount += Math.abs(transaction.value);
    });

    return categories;
  }

  private categorizeTransaction(description: string): string {
    const desc = description.toLowerCase();

    if (desc.includes('pix') || desc.includes('transferencia')) return 'Transferências';
    if (desc.includes('salario') || desc.includes('renda')) return 'Salário/Renda';
    if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('alimentacao')) return 'Alimentação';
    if (desc.includes('combustivel') || desc.includes('uber') || desc.includes('transporte')) return 'Transporte';
    if (desc.includes('farmacia') || desc.includes('saude') || desc.includes('medico')) return 'Saúde';
    if (desc.includes('energia') || desc.includes('agua') || desc.includes('conta')) return 'Contas Essenciais';
    if (desc.includes('cartao') || desc.includes('financiamento')) return 'Pagamentos de Cartão';
    if (this.bettingSites.some(site => desc.includes(site))) return 'Apostas e Jogos';

    return 'Outros';
  }

  private generateRecommendations(riskIndicators: any, creditScore: number, bettingDetection: any): string[] {
    const recommendations: string[] = [];

    if (creditScore < 600) {
      recommendations.push('Trabalhe na melhoria do seu histórico de crédito mantendo regularidade nos pagamentos');
    }

    if (riskIndicators.highExpenseRatio) {
      recommendations.push('Considere reduzir gastos para melhorar sua margem financeira');
    }

    if (riskIndicators.inconsistentIncome) {
      recommendations.push('Busque fontes de renda mais estáveis para melhorar a previsibilidade financeira');
    }

    if (bettingDetection.detected) {
      recommendations.push('Reduza ou elimine gastos com apostas para melhorar seu perfil de crédito');
    }

    if (riskIndicators.negativeBalance) {
      recommendations.push('Mantenha sempre um saldo positivo para demonstrar controle financeiro');
    }

    if (recommendations.length === 0) {
      recommendations.push('Mantenha os bons hábitos financeiros para preservar seu score de crédito');
    }

    return recommendations;
  }

  private generateAlerts(riskIndicators: any, bettingDetection: any, transactions: any[]): string[] {
    const alerts: string[] = [];

    if (bettingDetection.detected) {
      alerts.push(`Detectadas ${bettingDetection.transactionCount} transações relacionadas a apostas no valor de R$ ${bettingDetection.totalAmount.toFixed(2)}`);
    }

    if (riskIndicators.unusualTransactions) {
      alerts.push('Identificadas transações com valores muito acima da média');
    }

    if (riskIndicators.negativeBalance) {
      alerts.push('Períodos com saldo negativo identificados');
    }

    // Check for night time transactions (potential fraud indicator)
    const nightTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      const hour = date.getHours();
      return hour >= 0 && hour <= 5;
    });

    if (nightTransactions.length > 3) {
      alerts.push(`${nightTransactions.length} transações realizadas em horário atípico (madrugada)`);
    }

    return alerts;
  }
}

export const financialAnalyzer = new FinancialAnalyzer();
