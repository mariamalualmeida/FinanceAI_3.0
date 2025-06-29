interface ReportData {
  period: string;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
  categorizedExpenses: Record<string, number>;
  riskScore: number;
  creditScore: number;
  recommendations: string[];
  charts: {
    monthlyFlow: Array<{month: string, income: number, expenses: number}>;
    categoryDistribution: Array<{category: string, value: number, percentage: number}>;
    riskMetrics: Array<{metric: string, score: number, benchmark: number}>;
  };
}

interface ExportFormat {
  type: 'pdf' | 'excel' | 'json';
  template: 'detailed' | 'summary' | 'executive';
  includeCharts: boolean;
  locale: 'pt-BR' | 'en-US';
}

export class ReportGenerator {
  
  generateReport(analysisData: any, format: ExportFormat): ReportData {
    const reportData: ReportData = {
      period: this.determinePeriod(analysisData.transactions),
      totalIncome: analysisData.summary.totalCredits,
      totalExpenses: analysisData.summary.totalDebits,
      netFlow: analysisData.summary.finalBalance,
      categorizedExpenses: this.processCategoryData(analysisData.categoryBreakdown),
      riskScore: this.calculateRiskScore(analysisData),
      creditScore: analysisData.summary.creditScore,
      recommendations: this.generateEnhancedRecommendations(analysisData),
      charts: this.generateChartData(analysisData)
    };

    return reportData;
  }

  private determinePeriod(transactions: any[]): string {
    if (!transactions || transactions.length === 0) {
      return 'Período indeterminado';
    }

    const dates = transactions
      .map(t => new Date(t.date))
      .filter(d => !isNaN(d.getTime()))
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length === 0) {
      return 'Período indeterminado';
    }

    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];

    const formatter = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return `${formatter.format(firstDate)} a ${formatter.format(lastDate)}`;
  }

  private processCategoryData(categoryBreakdown: any): Record<string, number> {
    const processed: Record<string, number> = {};
    
    if (!categoryBreakdown) return processed;

    Object.entries(categoryBreakdown).forEach(([category, data]: [string, any]) => {
      processed[category] = data.total || 0;
    });

    return processed;
  }

  private calculateRiskScore(analysisData: any): number {
    const riskLevel = analysisData.summary.riskLevel;
    const riskScores = {
      'low': 25,
      'medium': 55,
      'high': 85
    };
    
    return riskScores[riskLevel as keyof typeof riskScores] || 50;
  }

  private generateEnhancedRecommendations(analysisData: any): string[] {
    const recommendations: string[] = [];
    const categoryBreakdown = analysisData.categoryBreakdown || {};
    const riskLevel = analysisData.summary.riskLevel;
    const creditScore = analysisData.summary.creditScore;

    // Análise de gastos excessivos
    const sortedCategories = Object.entries(categoryBreakdown)
      .sort(([,a]: any, [,b]: any) => b.percentage - a.percentage);

    if (sortedCategories.length > 0) {
      const [topCategory, topData]: any = sortedCategories[0];
      if (topData.percentage > 50) {
        recommendations.push(`⚠️ Atenção: ${topData.percentage.toFixed(1)}% dos gastos concentrados em ${topCategory}. Considere diversificar.`);
      }
    }

    // Recomendações baseadas no score de crédito
    if (creditScore < 400) {
      recommendations.push('📉 Score de crédito baixo. Priorize redução de dívidas e regularize pendências.');
    } else if (creditScore < 600) {
      recommendations.push('📊 Score médio. Mantenha consistência de pagamentos para melhorar.');
    } else {
      recommendations.push('✅ Excelente score de crédito. Considere produtos premium.');
    }

    // Análise de categorias específicas
    if (categoryBreakdown['Alimentação']?.percentage > 30) {
      recommendations.push('🍽️ Gastos com alimentação elevados. Considere planejamento de refeições.');
    }

    if (categoryBreakdown['Entretenimento']?.percentage > 20) {
      recommendations.push('🎬 Gastos com entretenimento representativos. Avalie subscriptions desnecessárias.');
    }

    if (categoryBreakdown['Investimentos']?.total > 0) {
      recommendations.push('💰 Ótimo! Você está investindo. Continue com aportes regulares.');
    } else {
      recommendations.push('💡 Considere iniciar investimentos, mesmo com pequenos valores.');
    }

    // Recomendações de risco
    if (riskLevel === 'high') {
      recommendations.push('🚨 Padrões de alto risco detectados. Monitore transações suspeitas.');
    }

    return recommendations;
  }

  private generateChartData(analysisData: any): ReportData['charts'] {
    return {
      monthlyFlow: this.generateMonthlyFlowData(analysisData.transactions),
      categoryDistribution: this.generateCategoryDistribution(analysisData.categoryBreakdown),
      riskMetrics: this.generateRiskMetrics(analysisData)
    };
  }

  private generateMonthlyFlowData(transactions: any[]): Array<{month: string, income: number, expenses: number}> {
    const monthlyData: Record<string, {income: number, expenses: number}> = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'credit') {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: this.formatMonthName(month),
        income: data.income,
        expenses: data.expenses
      }));
  }

  private generateCategoryDistribution(categoryBreakdown: any): Array<{category: string, value: number, percentage: number}> {
    if (!categoryBreakdown) return [];

    return Object.entries(categoryBreakdown)
      .map(([category, data]: [string, any]) => ({
        category,
        value: data.total || 0,
        percentage: data.percentage || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 categorias
  }

  private generateRiskMetrics(analysisData: any): Array<{metric: string, score: number, benchmark: number}> {
    const creditScore = analysisData.summary.creditScore;
    const riskScore = this.calculateRiskScore(analysisData);
    const consistencyScore = this.calculateConsistencyScore(analysisData.transactions);

    return [
      { metric: 'Score de Crédito', score: creditScore, benchmark: 650 },
      { metric: 'Risco Geral', score: 100 - riskScore, benchmark: 70 },
      { metric: 'Consistência', score: consistencyScore, benchmark: 80 },
      { metric: 'Diversificação', score: this.calculateDiversificationScore(analysisData.categoryBreakdown), benchmark: 75 }
    ];
  }

  private calculateConsistencyScore(transactions: any[]): number {
    if (!transactions || transactions.length < 3) return 50;

    const monthlyIncomes = this.groupByMonth(transactions.filter(t => t.type === 'credit'));
    const incomeValues = Object.values(monthlyIncomes).map((t: any) => t.reduce((sum: number, tx: any) => sum + tx.amount, 0));

    if (incomeValues.length < 2) return 50;

    const average = incomeValues.reduce((sum, val) => sum + val, 0) / incomeValues.length;
    const variance = incomeValues.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / incomeValues.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = average > 0 ? standardDeviation / average : 1;

    return Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  }

  private calculateDiversificationScore(categoryBreakdown: any): number {
    if (!categoryBreakdown) return 0;

    const categories = Object.keys(categoryBreakdown);
    const totalExpenses = Object.values(categoryBreakdown).reduce((sum: number, cat: any) => sum + cat.total, 0);

    if (categories.length <= 1 || totalExpenses === 0) return 0;

    // Calcular índice de Herfindahl-Hirschman (HHI) invertido
    const hhi = categories.reduce((sum, category) => {
      const share = categoryBreakdown[category].total / totalExpenses;
      return sum + Math.pow(share, 2);
    }, 0);

    // Converter HHI para score de diversificação (0-100)
    const maxHHI = 1; // Máximo (concentração total)
    const minHHI = 1 / categories.length; // Mínimo (distribuição perfeita)
    
    return Math.max(0, Math.min(100, ((maxHHI - hhi) / (maxHHI - minHHI)) * 100));
  }

  private groupByMonth(transactions: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      
      grouped[monthKey].push(transaction);
    });

    return grouped;
  }

  private formatMonthName(monthKey: string): string {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    return new Intl.DateTimeFormat('pt-BR', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  // Métodos para diferentes formatos de exportação
  generateJSONReport(reportData: ReportData): string {
    return JSON.stringify(reportData, null, 2);
  }

  generatePDFContent(reportData: ReportData): string {
    // Gerar HTML que pode ser convertido para PDF
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório Financeiro - ${reportData.period}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .metric { background: #f5f5f5; padding: 15px; border-radius: 8px; }
          .recommendations { margin-top: 30px; }
          .recommendation { margin-bottom: 10px; padding: 10px; background: #e8f4f8; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Relatório de Análise Financeira</h1>
          <h2>${reportData.period}</h2>
        </div>
        
        <div class="summary">
          <div class="metric">
            <h3>Receitas</h3>
            <p>R$ ${reportData.totalIncome.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
          <div class="metric">
            <h3>Despesas</h3>
            <p>R$ ${reportData.totalExpenses.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
          <div class="metric">
            <h3>Saldo Líquido</h3>
            <p>R$ ${reportData.netFlow.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
          </div>
          <div class="metric">
            <h3>Score de Crédito</h3>
            <p>${reportData.creditScore}</p>
          </div>
        </div>
        
        <div class="recommendations">
          <h3>Recomendações</h3>
          ${reportData.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
        </div>
      </body>
      </html>
    `;
  }

  generateExcelData(reportData: ReportData): any {
    // Estrutura de dados para exportação Excel
    return {
      sheets: [
        {
          name: 'Resumo',
          data: [
            ['Período', reportData.period],
            ['Total Receitas', reportData.totalIncome],
            ['Total Despesas', reportData.totalExpenses],
            ['Saldo Líquido', reportData.netFlow],
            ['Score de Crédito', reportData.creditScore],
            ['Score de Risco', reportData.riskScore]
          ]
        },
        {
          name: 'Categorias',
          data: [
            ['Categoria', 'Valor', 'Percentual'],
            ...reportData.charts.categoryDistribution.map(cat => [
              cat.category,
              cat.value,
              `${cat.percentage.toFixed(2)}%`
            ])
          ]
        },
        {
          name: 'Recomendações',
          data: [
            ['Recomendação'],
            ...reportData.recommendations.map(rec => [rec])
          ]
        }
      ]
    };
  }
}

export const reportGenerator = new ReportGenerator();