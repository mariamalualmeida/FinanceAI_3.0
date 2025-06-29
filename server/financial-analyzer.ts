import { storage } from './storage';
import { multiLlmOrchestrator } from './multi-llm-orchestrator';
import { fileProcessor } from './services/fileProcessor';
import type { InsertFinancialAnalysis, InsertTransaction } from '@shared/schema';

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  subcategory?: string;
}

interface FinancialAnalysisResult {
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  transactionCount: number;
  suspiciousTransactions: number;
  recommendations: string[];
  patterns: {
    gambling: boolean;
    highRisk: boolean;
    recurringPayments: number;
    cashFlow: 'positive' | 'negative' | 'stable';
  };
}

export class FinancialAnalyzer {
  constructor() {
    // Inicializar o orquestrador Multi-LLM
    multiLlmOrchestrator.initialize().catch(console.error);
  }

  async analyzeFinancialData(
    userId: number,
    conversationId: string | null,
    processedDocument: any,
    fileName: string
  ): Promise<FinancialAnalysisResult> {
    try {
      const transactions = processedDocument.metadata.transactions || [];
      const financialSummary = processedDocument.metadata.financialSummary || {};
      
      // Convert transactions to internal format
      const formattedTransactions = transactions.map((t: any) => ({
        date: t.date,
        description: t.description || '',
        amount: Math.abs(t.value || 0),
        type: t.value >= 0 ? 'credit' : 'debit',
        category: t.category || 'outros',
        subcategory: t.subcategory || 'nao_categorizado'
      }));

      // Calculate credit score using the file processor
      const creditScore = await fileProcessor.calculateCreditScore(transactions, processedDocument.metadata.personalData);
      
      // Perform comprehensive analysis
      const analysisResult = await this.performAnalysis(formattedTransactions, processedDocument.text);
      
      // Override with calculated values from processing
      analysisResult.creditScore = creditScore;
      analysisResult.totalIncome = financialSummary.total_income || 0;
      analysisResult.totalExpenses = financialSummary.total_expenses || 0;
      analysisResult.balance = financialSummary.net_balance || 0;
      analysisResult.transactionCount = financialSummary.transaction_count || 0;
      
      // Update risk level based on credit score
      if (creditScore >= 700) {
        analysisResult.riskLevel = 'low';
      } else if (creditScore >= 500) {
        analysisResult.riskLevel = 'medium';
      } else {
        analysisResult.riskLevel = 'high';
      }

      // Save analysis to database
      const analysis = await storage.createFinancialAnalysis({
        userId,
        conversationId: conversationId,
        analysisType: 'comprehensive',
        results: analysisResult,
        score: creditScore.toString(),
        riskLevel: analysisResult.riskLevel,
        recommendations: analysisResult.recommendations.join('\n')
      });

      // Save individual transactions
      if (formattedTransactions.length > 0) {
        const transactionRecords = formattedTransactions.map((t: any) => ({
          analysisId: analysis.id,
          date: new Date(t.date),
          description: t.description,
          amount: t.amount.toString(),
          type: t.type,
          category: t.category,
          subcategory: t.subcategory,
          isSuspicious: this.isSuspiciousTransaction(t),
          metadata: { originalFile: fileName }
        }));

        await storage.createMultipleTransactions(transactionRecords);
      }

      return analysisResult;
    } catch (error) {
      console.error('Erro na análise financeira:', error);
      throw new Error('Falha ao analisar dados financeiros');
    }
  }

  async analyzeFinancialDocument(
    userId: number,
    conversationId: string,
    fileContent: string,
    fileName: string
  ): Promise<FinancialAnalysisResult> {
    try {
      // Extrair transações usando IA
      const transactions = await this.extractTransactions(fileContent);
      
      // Analisar padrões e calcular score
      const analysisResult = await this.performAnalysis(transactions, fileContent);
      
      // Salvar análise no banco
      const analysis = await storage.createFinancialAnalysis({
        userId,
        conversationId: conversationId,
        analysisType: 'comprehensive',
        results: analysisResult,
        score: analysisResult.creditScore.toString(),
        riskLevel: analysisResult.riskLevel,
        recommendations: analysisResult.recommendations.join('\n')
      });

      // Salvar transações extraídas
      if (transactions.length > 0) {
        const transactionRecords = transactions.map(t => ({
          analysisId: analysis.id,
          date: new Date(t.date),
          description: t.description,
          amount: t.amount.toString(),
          type: t.type,
          category: t.category,
          subcategory: t.subcategory,
          isSuspicious: this.isSuspiciousTransaction(t),
          metadata: { originalFile: fileName }
        }));

        await storage.createMultipleTransactions(transactionRecords);
      }

      return analysisResult;
    } catch (error) {
      console.error('Erro na análise financeira:', error);
      throw new Error('Falha ao analisar documento financeiro');
    }
  }

  private async extractTransactions(content: string): Promise<ExtractedTransaction[]> {
    const prompt = `
Analise o seguinte documento financeiro e extraia todas as transações em formato JSON.

Para cada transação, forneça:
- date: data no formato ISO (YYYY-MM-DD)
- description: descrição da transação
- amount: valor numérico (positivo para créditos, negativo para débitos)
- type: "credit" ou "debit"
- category: categoria da transação (ex: "alimentação", "transporte", "salário")
- subcategory: subcategoria opcional

Documento:
${content}

Responda apenas com um array JSON válido de transações:`;

    try {
      const response = await multiLlmOrchestrator.processMessage(prompt, {
        strategy: 'balanced'
      });

      const result = JSON.parse(response || '{"transactions": []}');
      return result.transactions || [];
    } catch (error) {
      console.error('Erro ao extrair transações:', error);
      return [];
    }
  }

  private async performAnalysis(
    transactions: ExtractedTransaction[],
    content: string
  ): Promise<FinancialAnalysisResult> {
    const prompt = `
Como especialista em análise financeira, analise as seguintes transações e documento:

TRANSAÇÕES:
${JSON.stringify(transactions, null, 2)}

DOCUMENTO ORIGINAL:
${content}

Forneça uma análise completa em JSON com:
{
  "creditScore": número de 0-1000,
  "riskLevel": "low" | "medium" | "high",
  "totalIncome": total de receitas,
  "totalExpenses": total de gastos,
  "balance": saldo/diferença,
  "transactionCount": número de transações,
  "suspiciousTransactions": número de transações suspeitas,
  "recommendations": array de recomendações específicas,
  "patterns": {
    "gambling": boolean (detecta apostas),
    "highRisk": boolean (comportamento de alto risco),
    "recurringPayments": número de pagamentos recorrentes,
    "cashFlow": "positive" | "negative" | "stable"
  }
}

Considere:
- Padrões de gastos
- Regularidade de renda
- Transações suspeitas (apostas, valores altos incomuns)
- Capacidade de pagamento
- Histórico de inadimplência
- Diversificação de gastos`;

    try {
      const response = await multiLlmOrchestrator.processMessage(prompt, {
        strategy: 'balanced'
      });

      const analysis = JSON.parse(response || '{}');
      
      // Validar e ajustar resultados
      return {
        creditScore: Math.min(1000, Math.max(0, analysis.creditScore || 500)),
        riskLevel: ['low', 'medium', 'high'].includes(analysis.riskLevel) ? analysis.riskLevel : 'medium',
        totalIncome: analysis.totalIncome || 0,
        totalExpenses: analysis.totalExpenses || 0,
        balance: analysis.balance || 0,
        transactionCount: transactions.length,
        suspiciousTransactions: analysis.suspiciousTransactions || 0,
        recommendations: Array.isArray(analysis.recommendations) ? analysis.recommendations : [],
        patterns: {
          gambling: analysis.patterns?.gambling || false,
          highRisk: analysis.patterns?.highRisk || false,
          recurringPayments: analysis.patterns?.recurringPayments || 0,
          cashFlow: ['positive', 'negative', 'stable'].includes(analysis.patterns?.cashFlow) ? 
                   analysis.patterns.cashFlow : 'stable'
        }
      };
    } catch (error) {
      console.error('Erro na análise:', error);
      // Retornar análise básica em caso de erro
      return this.generateBasicAnalysis(transactions);
    }
  }

  private generateBasicAnalysis(transactions: ExtractedTransaction[]): FinancialAnalysisResult {
    const totalIncome = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = totalIncome - totalExpenses;
    const cashFlowRatio = totalIncome > 0 ? balance / totalIncome : 0;
    
    let creditScore = 500; // Base score
    if (cashFlowRatio > 0.3) creditScore += 200;
    else if (cashFlowRatio > 0.1) creditScore += 100;
    else if (cashFlowRatio < -0.2) creditScore -= 200;
    
    const riskLevel = creditScore > 700 ? 'low' : creditScore > 400 ? 'medium' : 'high';
    
    return {
      creditScore: Math.min(1000, Math.max(0, creditScore)),
      riskLevel,
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: transactions.length,
      suspiciousTransactions: 0,
      recommendations: [
        'Análise básica realizada. Para insights mais detalhados, forneça documentos completos.',
        balance < 0 ? 'Considere revisar seus gastos para equilibrar o orçamento.' : 
                     'Mantenha o controle financeiro atual.'
      ],
      patterns: {
        gambling: false,
        highRisk: riskLevel === 'high',
        recurringPayments: 0,
        cashFlow: balance > 0 ? 'positive' : balance < 0 ? 'negative' : 'stable'
      }
    };
  }

  private isSuspiciousTransaction(transaction: ExtractedTransaction): boolean {
    const suspiciousKeywords = [
      'bet', 'casa de apostas', 'jogo', 'cassino', 'poker', 'bingo',
      'loteria', 'aposta', 'gambling', 'sportingbet', 'pixbet'
    ];
    
    const description = transaction.description.toLowerCase();
    const hasKeyword = suspiciousKeywords.some(keyword => description.includes(keyword));
    const isHighValue = Math.abs(transaction.amount) > 5000;
    const isRoundNumber = Math.abs(transaction.amount) % 100 === 0 && Math.abs(transaction.amount) > 1000;
    
    return hasKeyword || (isHighValue && isRoundNumber);
  }

  async generateReport(analysisId: string): Promise<string> {
    const analysis = await storage.getFinancialAnalysis(analysisId);
    if (!analysis) throw new Error('Análise não encontrada');

    const transactions = await storage.getTransactionsByAnalysis(analysisId);
    const results = analysis.results as FinancialAnalysisResult;

    const prompt = `
Gere um relatório financeiro profissional em português baseado na seguinte análise:

DADOS DA ANÁLISE:
- Score de Crédito: ${results.creditScore}
- Nível de Risco: ${results.riskLevel}
- Receitas Totais: R$ ${results.totalIncome.toLocaleString('pt-BR')}
- Gastos Totais: R$ ${results.totalExpenses.toLocaleString('pt-BR')}
- Saldo: R$ ${results.balance.toLocaleString('pt-BR')}
- Total de Transações: ${results.transactionCount}
- Transações Suspeitas: ${results.suspiciousTransactions}

PADRÕES DETECTADOS:
- Apostas/Jogos: ${results.patterns.gambling ? 'Sim' : 'Não'}
- Alto Risco: ${results.patterns.highRisk ? 'Sim' : 'Não'}
- Pagamentos Recorrentes: ${results.patterns.recurringPayments}
- Fluxo de Caixa: ${results.patterns.cashFlow}

RECOMENDAÇÕES:
${results.recommendations.join('\n- ')}

Gere um relatório estruturado, profissional e detalhado com seções claras: 
Resumo Executivo, Análise Detalhada, Padrões Identificados, Score de Crédito, 
Recomendações e Conclusão.`;

    try {
      const response = await multiLlmOrchestrator.processChainedPrompts(
        'Gerar relatório financeiro detalhado',
        prompt
      );

      return response || 'Erro ao gerar relatório';
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      return 'Erro ao gerar relatório detalhado';
    }
  }
}

export const financialAnalyzer = new FinancialAnalyzer();