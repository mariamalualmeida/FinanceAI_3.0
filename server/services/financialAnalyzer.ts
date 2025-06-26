interface FinancialAnalyzer {
  analyzeDocument(filePath: string, fileType: string): Promise<any>;
  calculateRiskScore(transactionData: any[]): Promise<number>;
  detectSuspiciousActivity(transactionData: any[]): Promise<any[]>;
}

class MockFinancialAnalyzer implements FinancialAnalyzer {
  async analyzeDocument(filePath: string, fileType: string): Promise<any> {
    // Simulate document analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      documentType: fileType,
      transactionCount: Math.floor(Math.random() * 50) + 10,
      totalIncome: Math.floor(Math.random() * 10000) + 5000,
      totalExpenses: Math.floor(Math.random() * 8000) + 3000,
      riskScore: Math.floor(Math.random() * 100),
      analysis: {
        patterns: ["Gastos regulares identificados", "Receita estável", "Baixo risco de inadimplência"],
        recommendations: ["Revisar gastos com lazer", "Aumentar poupança mensal", "Diversificar investimentos"]
      }
    };
  }

  async calculateRiskScore(transactionData: any[]): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 500));
    return Math.floor(Math.random() * 100);
  }

  async detectSuspiciousActivity(transactionData: any[]): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        type: "unusual_spending",
        description: "Gasto acima da média detectado",
        amount: 2500,
        date: new Date().toISOString()
      }
    ];
  }
}

export const financialAnalyzer = new MockFinancialAnalyzer();