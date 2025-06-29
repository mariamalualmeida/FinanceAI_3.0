interface FraudPattern {
  name: string;
  description: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
  threshold: number;
}

interface FraudAlert {
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
  evidence: string[];
  recommendation: string;
  timestamp: Date;
}

export class FraudDetectionSystem {
  private patterns: FraudPattern[] = [
    {
      name: 'Atividade de Jogos',
      description: 'Transações relacionadas a jogos de azar e apostas',
      indicators: [
        'bet365', 'betano', 'betfair', 'sportingbet', 'rivalo',
        'jogo', 'aposta', 'cassino', 'poker', 'bingo',
        'loteria', 'raspadinha', 'mega sena', 'slot',
        'blaze', 'casa de apostas', 'gambling'
      ],
      severity: 'high',
      action: 'Monitorar padrões de vício em jogos',
      threshold: 2
    },
    
    {
      name: 'Transações de Estruturação',
      description: 'Múltiplas transações pequenas para evitar detecção',
      indicators: ['estruturação', 'fracionamento'],
      severity: 'critical',
      action: 'Investigar possível lavagem de dinheiro',
      threshold: 5
    },
    
    {
      name: 'Horários Suspeitos',
      description: 'Transações em horários incomuns',
      indicators: ['madrugada', 'horário comercial'],
      severity: 'medium',
      action: 'Verificar autenticidade das transações',
      threshold: 3
    },
    
    {
      name: 'Mula Financeira',
      description: 'Padrão típico de mula financeira',
      indicators: [
        'transferencia rapida', 'dinheiro facil', 'renda extra',
        'trabalho em casa', 'recebimento terceiros'
      ],
      severity: 'critical',
      action: 'Possível envolvimento em esquema fraudulento',
      threshold: 1
    },
    
    {
      name: 'Criptomoedas Suspeitas',
      description: 'Transações com exchanges não regulamentadas',
      indicators: [
        'bitcoin', 'crypto', 'exchange', 'binance',
        'coinbase', 'mercado bitcoin', 'foxbit',
        'wallet', 'carteira digital'
      ],
      severity: 'medium',
      action: 'Verificar origem e destino das criptomoedas',
      threshold: 3
    },
    
    {
      name: 'Empréstimos Informais',
      description: 'Empréstimos fora do sistema bancário',
      indicators: [
        'emprestimo pessoal', 'dinheiro no bolso',
        'sem burocracia', 'credito facil', 'sem consulta'
      ],
      severity: 'medium',
      action: 'Verificar taxas de juros e legitimidade',
      threshold: 2
    },
    
    {
      name: 'Atividade Comercial Irregular',
      description: 'Padrões que sugerem comércio irregular',
      indicators: [
        'mercadoria importada', 'sem nota fiscal',
        'produto original', 'direto da fabrica',
        'preco de atacado', 'revenda'
      ],
      severity: 'medium',
      action: 'Verificar regularidade fiscal',
      threshold: 3
    },
    
    {
      name: 'Golpes Digitais',
      description: 'Transações relacionadas a golpes online',
      indicators: [
        'premio', 'sorteio', 'ganhador', 'taxa de liberacao',
        'documento urgente', 'bloqueio conta', 'verificacao'
      ],
      severity: 'high',
      action: 'Possível vítima ou participante de golpe',
      threshold: 1
    }
  ];

  analyzeTransactions(transactions: any[]): FraudAlert[] {
    const alerts: FraudAlert[] = [];
    
    for (const pattern of this.patterns) {
      const detectedInstances = this.detectPattern(transactions, pattern);
      
      if (detectedInstances.length >= pattern.threshold) {
        const alert: FraudAlert = {
          pattern: pattern.name,
          severity: pattern.severity,
          confidence: this.calculateConfidence(detectedInstances, pattern),
          description: pattern.description,
          evidence: detectedInstances.map(instance => 
            `${instance.date}: ${instance.description} (R$ ${instance.amount})`
          ),
          recommendation: pattern.action,
          timestamp: new Date()
        };
        
        alerts.push(alert);
      }
    }
    
    // Adicionar análises comportamentais
    alerts.push(...this.analyzeBehavioralPatterns(transactions));
    
    return alerts.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  private detectPattern(transactions: any[], pattern: FraudPattern): any[] {
    const detectedTransactions: any[] = [];
    
    for (const transaction of transactions) {
      const description = transaction.description.toLowerCase();
      
      for (const indicator of pattern.indicators) {
        if (description.includes(indicator.toLowerCase())) {
          detectedTransactions.push({
            ...transaction,
            matchedIndicator: indicator
          });
          break;
        }
      }
    }
    
    return detectedTransactions;
  }

  private calculateConfidence(instances: any[], pattern: FraudPattern): number {
    const baseConfidence = Math.min(instances.length / (pattern.threshold * 2), 1);
    const frequencyBonus = instances.length > pattern.threshold * 3 ? 0.2 : 0;
    const amountWeight = this.calculateAmountWeight(instances);
    
    return Math.min(baseConfidence + frequencyBonus + amountWeight, 1);
  }

  private calculateAmountWeight(instances: any[]): number {
    if (instances.length === 0) return 0;
    
    const totalAmount = instances.reduce((sum, instance) => sum + instance.amount, 0);
    const averageAmount = totalAmount / instances.length;
    
    // Valores altos aumentam a confiança
    if (averageAmount > 1000) return 0.2;
    if (averageAmount > 500) return 0.1;
    return 0;
  }

  private analyzeBehavioralPatterns(transactions: any[]): FraudAlert[] {
    const behavioralAlerts: FraudAlert[] = [];
    
    // Padrão 1: Múltiplas transações do mesmo valor
    const duplicateAmounts = this.findDuplicateAmounts(transactions);
    if (duplicateAmounts.length > 0) {
      behavioralAlerts.push({
        pattern: 'Valores Repetitivos',
        severity: 'medium',
        confidence: 0.7,
        description: 'Múltiplas transações com valores idênticos detectadas',
        evidence: duplicateAmounts.map(group => 
          `${group.amount}: ${group.count} ocorrências`
        ),
        recommendation: 'Verificar se há automação ou estruturação',
        timestamp: new Date()
      });
    }
    
    // Padrão 2: Transações em sequência rápida
    const rapidTransactions = this.findRapidTransactions(transactions);
    if (rapidTransactions.length > 5) {
      behavioralAlerts.push({
        pattern: 'Transações Rápidas',
        severity: 'medium',
        confidence: 0.6,
        description: 'Múltiplas transações em curto período',
        evidence: rapidTransactions.map(t => 
          `${t.date}: ${t.description}`
        ).slice(0, 5),
        recommendation: 'Verificar autenticidade e possível automação',
        timestamp: new Date()
      });
    }
    
    // Padrão 3: Valores just below limites regulatórios
    const avoidancePattern = this.detectLimitAvoidance(transactions);
    if (avoidancePattern.length > 0) {
      behavioralAlerts.push({
        pattern: 'Evasão de Limites',
        severity: 'high',
        confidence: 0.8,
        description: 'Transações próximas a limites regulatórios',
        evidence: avoidancePattern.map(t => 
          `${t.date}: R$ ${t.amount} (limite: R$ ${t.suspectedLimit})`
        ),
        recommendation: 'Possível tentativa de evitar reportes regulatórios',
        timestamp: new Date()
      });
    }
    
    return behavioralAlerts;
  }

  private findDuplicateAmounts(transactions: any[]): Array<{amount: number, count: number}> {
    const amountCounts: Record<number, number> = {};
    
    transactions.forEach(t => {
      amountCounts[t.amount] = (amountCounts[t.amount] || 0) + 1;
    });
    
    return Object.entries(amountCounts)
      .filter(([_, count]) => count >= 3)
      .map(([amount, count]) => ({ amount: parseFloat(amount), count }));
  }

  private findRapidTransactions(transactions: any[]): any[] {
    const rapidOnes: any[] = [];
    const sortedTransactions = transactions
      .filter(t => t.date)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (let i = 1; i < sortedTransactions.length; i++) {
      const prevDate = new Date(sortedTransactions[i - 1].date);
      const currDate = new Date(sortedTransactions[i].date);
      const timeDiff = currDate.getTime() - prevDate.getTime();
      
      // Transações em menos de 1 hora
      if (timeDiff < 3600000) {
        rapidOnes.push(sortedTransactions[i]);
      }
    }
    
    return rapidOnes;
  }

  private detectLimitAvoidance(transactions: any[]): any[] {
    const suspiciousLimits = [9999, 4999, 2999, 1999, 999]; // Valores comuns de limite
    const avoidanceTransactions: any[] = [];
    
    transactions.forEach(t => {
      for (const limit of suspiciousLimits) {
        if (t.amount >= limit * 0.95 && t.amount < limit) {
          avoidanceTransactions.push({
            ...t,
            suspectedLimit: limit
          });
          break;
        }
      }
    });
    
    return avoidanceTransactions;
  }

  private getSeverityWeight(severity: string): number {
    const weights = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4
    };
    return weights[severity as keyof typeof weights] || 0;
  }

  // Métodos para relatórios
  generateFraudReport(alerts: FraudAlert[]): string {
    if (alerts.length === 0) {
      return '✅ Nenhuma atividade suspeita detectada.';
    }
    
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const highAlerts = alerts.filter(a => a.severity === 'high');
    
    let report = `🚨 RELATÓRIO DE DETECÇÃO DE FRAUDES\n\n`;
    
    if (criticalAlerts.length > 0) {
      report += `⚠️ ALERTAS CRÍTICOS (${criticalAlerts.length}):\n`;
      criticalAlerts.forEach(alert => {
        report += `- ${alert.pattern}: ${alert.description}\n`;
        report += `  Confiança: ${(alert.confidence * 100).toFixed(1)}%\n`;
        report += `  Ação: ${alert.recommendation}\n\n`;
      });
    }
    
    if (highAlerts.length > 0) {
      report += `🔶 ALERTAS DE ALTO RISCO (${highAlerts.length}):\n`;
      highAlerts.forEach(alert => {
        report += `- ${alert.pattern}: ${alert.description}\n`;
        report += `  Confiança: ${(alert.confidence * 100).toFixed(1)}%\n\n`;
      });
    }
    
    const totalRiskScore = this.calculateOverallRiskScore(alerts);
    report += `📊 SCORE DE RISCO GERAL: ${totalRiskScore}/100\n`;
    
    if (totalRiskScore > 70) {
      report += `🚨 RECOMENDAÇÃO: Investigação detalhada necessária.`;
    } else if (totalRiskScore > 40) {
      report += `⚠️ RECOMENDAÇÃO: Monitoramento contínuo recomendado.`;
    } else {
      report += `✅ RECOMENDAÇÃO: Perfil de baixo risco.`;
    }
    
    return report;
  }

  private calculateOverallRiskScore(alerts: FraudAlert[]): number {
    if (alerts.length === 0) return 0;
    
    const weightedScore = alerts.reduce((total, alert) => {
      const severityWeight = this.getSeverityWeight(alert.severity);
      return total + (alert.confidence * severityWeight * 25);
    }, 0);
    
    return Math.min(100, Math.round(weightedScore));
  }

  // Configuração personalizada
  addCustomPattern(pattern: FraudPattern): void {
    this.patterns.push(pattern);
  }

  updatePatternThreshold(patternName: string, newThreshold: number): void {
    const pattern = this.patterns.find(p => p.name === patternName);
    if (pattern) {
      pattern.threshold = newThreshold;
    }
  }

  getPatternStatistics(): Array<{name: string, threshold: number, severity: string}> {
    return this.patterns.map(p => ({
      name: p.name,
      threshold: p.threshold,
      severity: p.severity
    }));
  }
}

export const fraudDetectionSystem = new FraudDetectionSystem();