import type { InsertFinancialAnalysis, InsertTransaction } from '../types/schema';

export interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'debit' | 'credit';
  category?: string;
  subcategory?: string;
}

export interface FinancialAnalysisResult {
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
  private llmOrchestrator: any;
  private storage: any;

  constructor(llmOrchestrator: any, storage: any) {
    this.llmOrchestrator = llmOrchestrator;
    this.storage = storage;
  }

  async analyzeFinancialDocument(fileUploadId: string, fileContent: string): Promise<void> {
    try {
      // Extract transactions using LLM
      const transactions = await this.extractTransactions(fileContent);
      
      // Perform financial analysis
      const analysis = await this.performAnalysis(transactions, fileUploadId);
      
      // Store analysis results
      const analysisData: InsertFinancialAnalysis = {
        id: crypto.randomUUID(),
        fileUploadId,
        results: analysis,
        status: 'completed',
        recommendations: JSON.stringify(analysis.recommendations)
      };

      const savedAnalysis = await this.storage.createFinancialAnalysis(analysisData);

      // Store individual transactions
      if (transactions.length > 0) {
        const transactionData: InsertTransaction[] = transactions.map(t => ({
          analysisId: savedAnalysis.id,
          date: new Date(t.date),
          description: t.description,
          amount: t.amount.toString(),
          type: t.type,
          category: t.category || null,
          subcategory: t.subcategory || null,
          isRecurring: this.isRecurringTransaction(t),
          isSuspicious: this.isSuspiciousTransaction(t)
        }));

        await this.storage.createMultipleTransactions(transactionData);
      }

      console.log(`Financial analysis completed for file: ${fileUploadId}`);
    } catch (error) {
      console.error('Erro na análise financeira:', error);
      
      // Update file status to error
      await this.storage.updateFileUploadStatus(fileUploadId, 'error');
      throw error;
    }
  }

  private async extractTransactions(content: string): Promise<ExtractedTransaction[]> {
    try {
      const prompt = `
Analise o seguinte conteúdo de documento financeiro e extraia todas as transações em formato JSON.

Para cada transação, extraia:
- date: data da transação no formato YYYY-MM-DD
- description: descrição detalhada da transação
- amount: valor em número (positivo para créditos, negativo para débitos)
- type: "credit" para entrada ou "debit" para saída
- category: categoria da transação (ex: "alimentação", "transporte", "lazer")
- subcategory: subcategoria mais específica se aplicável

Conteúdo do documento:
${content}

Responda APENAS com um JSON válido no formato:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "Descrição da transação",
      "amount": 100.50,
      "type": "credit",
      "category": "categoria",
      "subcategory": "subcategoria"
    }
  ]
}
`;

      const response = await this.llmOrchestrator.processMessage(prompt);
      
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Não foi possível extrair JSON da resposta');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.transactions || [];
    } catch (error) {
      console.error('Erro ao extrair transações:', error);
      throw new Error('Falha na extração de transações do documento');
    }
  }

  private async performAnalysis(transactions: ExtractedTransaction[], fileUploadId: string): Promise<FinancialAnalysisResult> {
    try {
      const basicAnalysis = this.generateBasicAnalysis(transactions);
      
      // Enhanced analysis using LLM
      const enhancedPrompt = `
Analise as seguintes transações financeiras e forneça insights detalhados:

Transações: ${JSON.stringify(transactions, null, 2)}

Análise básica calculada:
- Score de crédito: ${basicAnalysis.creditScore}
- Nível de risco: ${basicAnalysis.riskLevel}
- Total de entradas: R$ ${basicAnalysis.totalIncome}
- Total de saídas: R$ ${basicAnalysis.totalExpenses}
- Saldo: R$ ${basicAnalysis.balance}

Forneça recomendações específicas em português brasileiro para melhorar a situação financeira.
Responda com um JSON contendo apenas o array "recommendations" com 3-5 recomendações práticas.
`;

      const enhancedResponse = await this.llmOrchestrator.processMessage(enhancedPrompt);
      
      // Extract recommendations from LLM response
      let enhancedRecommendations = basicAnalysis.recommendations;
      try {
        const jsonMatch = enhancedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
            enhancedRecommendations = parsed.recommendations;
          }
        }
      } catch (parseError) {
        console.warn('Não foi possível extrair recomendações da IA, usando análise básica');
      }

      return {
        ...basicAnalysis,
        recommendations: enhancedRecommendations
      };
    } catch (error) {
      console.error('Erro na análise:', error);
      throw new Error('Falha na análise dos dados financeiros');
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
    const suspiciousTransactions = transactions.filter(t => this.isSuspiciousTransaction(t)).length;
    
    // Calculate credit score based on various factors
    let creditScore = 500; // Base score
    
    // Income factor
    if (totalIncome > 5000) creditScore += 100;
    else if (totalIncome > 2000) creditScore += 50;
    
    // Balance factor
    if (balance > 0) creditScore += 100;
    else if (balance > -1000) creditScore += 50;
    
    // Suspicious activity penalty
    creditScore -= suspiciousTransactions * 50;
    
    // Ensure score is within bounds
    creditScore = Math.max(300, Math.min(850, creditScore));
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (creditScore >= 700) riskLevel = 'low';
    else if (creditScore <= 500) riskLevel = 'high';
    
    // Detect patterns
    const gamblingKeywords = ['bet', 'casa', 'jogo', 'aposta', 'casino', 'loteria'];
    const gambling = transactions.some(t => 
      gamblingKeywords.some(keyword => 
        t.description.toLowerCase().includes(keyword)
      )
    );
    
    const recurringPayments = transactions.filter(t => this.isRecurringTransaction(t)).length;
    
    let cashFlow: 'positive' | 'negative' | 'stable' = 'stable';
    if (balance > totalIncome * 0.1) cashFlow = 'positive';
    else if (balance < totalIncome * -0.1) cashFlow = 'negative';
    
    return {
      creditScore,
      riskLevel,
      totalIncome,
      totalExpenses,
      balance,
      transactionCount: transactions.length,
      suspiciousTransactions,
      recommendations: [
        'Análise básica realizada. Para insights mais detalhados, forneça documentos completos.',
        'Mantenha o controle financeiro atual.'
      ],
      patterns: {
        gambling,
        highRisk: riskLevel === 'high',
        recurringPayments,
        cashFlow
      }
    };
  }

  private isRecurringTransaction(transaction: ExtractedTransaction): boolean {
    const recurringKeywords = ['salario', 'salary', 'rent', 'aluguel', 'internet', 'telefone', 'energia', 'agua'];
    return recurringKeywords.some(keyword => 
      transaction.description.toLowerCase().includes(keyword)
    );
  }

  private isSuspiciousTransaction(transaction: ExtractedTransaction): boolean {
    const suspiciousKeywords = ['bet', 'casa', 'jogo', 'aposta', 'casino', 'pix', 'ted'];
    const hasKeyword = suspiciousKeywords.some(keyword => 
      transaction.description.toLowerCase().includes(keyword)
    );
    
    const isHighValue = Math.abs(transaction.amount) > 10000;
    const isRoundNumber = Math.abs(transaction.amount) % 100 === 0;
    
    return hasKeyword || (isHighValue && isRoundNumber);
  }

  async generateReport(analysisId: string): Promise<string> {
    const analysis = await this.storage.getFinancialAnalysis(analysisId);
    if (!analysis) throw new Error('Análise não encontrada');

    const transactions = await this.storage.getTransactionsByAnalysis(analysisId);
    const results = analysis.results as FinancialAnalysisResult;

    const prompt = `
Gere um relatório financeiro profissional em português baseado na seguinte análise:

Análise:
${JSON.stringify(results, null, 2)}

Transações: ${transactions.length} transações analisadas

Crie um relatório em markdown com:
1. Título: "Análise Financeira Completa"
2. Score de crédito e nível de risco
3. Resumo financeiro (receitas, despesas, saldo)
4. Padrões identificados
5. Recomendações personalizadas

Use emojis para tornar o relatório mais visual e atraente.
`;

    try {
      const reportContent = await this.llmOrchestrator.processMessage(prompt);
      return reportContent;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      
      // Fallback to basic report
      return `📊 **Análise Financeira Completa**

**Score de Crédito:** ${results.creditScore}/1000
**Nível de Risco:** ${results.riskLevel === 'low' ? 'Baixo' : results.riskLevel === 'medium' ? 'Médio' : 'Alto'}

**Resumo Financeiro:**
- Receitas Totais: R$ ${results.totalIncome.toFixed(2)}
- Despesas Totais: R$ ${results.totalExpenses.toFixed(2)}
- Saldo: R$ ${results.balance.toFixed(2)}
- Transações Analisadas: ${results.transactionCount}
- Transações Suspeitas: ${results.suspiciousTransactions}

**Padrões Identificados:**
- Atividade de Apostas: ${results.patterns.gambling ? 'Detectada' : 'Não Detectada'}
- Alto Risco: ${results.patterns.highRisk ? 'Sim' : 'Não'}
- Pagamentos Recorrentes: ${results.patterns.recurringPayments}
- Fluxo de Caixa: ${results.patterns.cashFlow === 'positive' ? 'Positivo' : results.patterns.cashFlow === 'negative' ? 'Negativo' : 'Estável'}

**Recomendações:**
${results.recommendations.map(rec => `• ${rec}`).join('\n')}`;
    }
  }
}

export default FinancialAnalyzer;