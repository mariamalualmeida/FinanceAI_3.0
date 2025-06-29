/**
 * Financial Consultant - Sistema de Consultoria Financeira Personalizada
 * Implementa planos de ação, metas financeiras e consultoria inteligente
 */

import { MIG_AGENT_PROMPTS, getMigPrompt, processMigPrompt } from '../prompts/mig-agent-prompts';

export interface ClientProfile {
  id: string;
  name: string;
  age: number;
  monthlyIncome: number;
  familySize: number;
  region: string;
  profession: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  financialGoals: string[];
  currentDebts: number;
  currentSavings: number;
  emergencyFund: number;
}

export interface FinancialGoal {
  id: string;
  clientId: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: 'high' | 'medium' | 'low';
  category: 'emergency' | 'debt' | 'investment' | 'purchase' | 'retirement';
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface ActionPlan {
  id: string;
  clientId: string;
  goalId?: string;
  title: string;
  description: string;
  timeframe: 'short' | 'medium' | 'long'; // 1-6 months | 6-24 months | 24+ months
  steps: ActionStep[];
  metrics: PlanMetric[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface ActionStep {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completed: boolean;
  category: 'budget' | 'saving' | 'investment' | 'debt' | 'education';
  priority: number;
  estimatedImpact: number; // 1-10 scale
}

export interface PlanMetric {
  id: string;
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  measurementDate: string;
}

export interface ConsultancyReport {
  clientId: string;
  reportType: 'credit_analysis' | 'financial_planning' | 'investment_guidance' | 'debt_management';
  score: number;
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  recommendations: string[];
  actionPlan: ActionPlan;
  metrics: Record<string, number>;
  generatedAt: string;
  migAnalysis: string;
}

export class FinancialConsultant {
  private prompts = MIG_AGENT_PROMPTS;

  constructor() {
    console.log('🏛️ Financial Consultant initialized - Mig Agent v1.0');
  }

  /**
   * Analisa perfil do cliente e gera plano de ação personalizado
   */
  async generateActionPlan(
    clientProfile: ClientProfile,
    financialData: any,
    goalType: string = 'general'
  ): Promise<ActionPlan> {
    const prompt = getMigPrompt('mig-action-plan');
    if (!prompt) throw new Error('Action plan prompt not found');

    const variables = {
      current_situation: this.formatCurrentSituation(clientProfile, financialData),
      financial_goals: clientProfile.financialGoals.join(', '),
      timeline: this.determineTimeframe(clientProfile),
      constraints: this.identifyConstraints(clientProfile)
    };

    const processedPrompt = processMigPrompt(prompt, variables);
    
    // Gera plano baseado no perfil brasileiro
    const plan = this.createBrazilianActionPlan(clientProfile, financialData);
    
    return {
      id: `plan_${Date.now()}`,
      clientId: clientProfile.id,
      title: `Plano de Ação Personalizado - ${clientProfile.name}`,
      description: `Plano financeiro adaptado para ${clientProfile.profession} com renda de R$ ${clientProfile.monthlyIncome.toLocaleString('pt-BR')}`,
      timeframe: this.determineTimeframe(clientProfile) as 'short' | 'medium' | 'long',
      steps: plan.steps,
      metrics: plan.metrics,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Cria metas financeiras inteligentes baseadas no perfil
   */
  async generateFinancialGoals(clientProfile: ClientProfile): Promise<FinancialGoal[]> {
    const goals: FinancialGoal[] = [];
    const baseId = Date.now();

    // Meta 1: Reserva de Emergência (sempre prioritária)
    const emergencyAmount = this.calculateEmergencyFund(clientProfile);
    goals.push({
      id: `goal_${baseId + 1}`,
      clientId: clientProfile.id,
      title: 'Reserva de Emergência',
      description: `Formar reserva de R$ ${emergencyAmount.toLocaleString('pt-BR')} para proteção financeira`,
      targetAmount: emergencyAmount,
      currentAmount: clientProfile.emergencyFund,
      targetDate: this.calculateTargetDate(6), // 6 meses
      priority: 'high',
      category: 'emergency',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Meta 2: Quitação de Dívidas (se aplicável)
    if (clientProfile.currentDebts > 0) {
      goals.push({
        id: `goal_${baseId + 2}`,
        clientId: clientProfile.id,
        title: 'Quitação de Dívidas',
        description: `Quitar R$ ${clientProfile.currentDebts.toLocaleString('pt-BR')} em dívidas pendentes`,
        targetAmount: clientProfile.currentDebts,
        currentAmount: 0,
        targetDate: this.calculateTargetDate(12), // 12 meses
        priority: 'high',
        category: 'debt',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Meta 3: Objetivo de Poupança Mensal
    const monthlyTarget = clientProfile.monthlyIncome * 0.1; // 10% da renda
    goals.push({
      id: `goal_${baseId + 3}`,
      clientId: clientProfile.id,
      title: 'Poupança Mensal',
      description: `Poupar R$ ${monthlyTarget.toLocaleString('pt-BR')} mensalmente`,
      targetAmount: monthlyTarget * 12,
      currentAmount: 0,
      targetDate: this.calculateTargetDate(12),
      priority: 'medium',
      category: 'investment',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    return goals;
  }

  /**
   * Gera relatório de consultoria financeira completo
   */
  async generateConsultancyReport(
    clientProfile: ClientProfile,
    financialData: any,
    reportType: ConsultancyReport['reportType'] = 'financial_planning'
  ): Promise<ConsultancyReport> {
    const prompt = getMigPrompt('mig-reporting');
    if (!prompt) throw new Error('Reporting prompt not found');

    // Calcula métricas brasileiras
    const metrics = this.calculateBrazilianMetrics(clientProfile, financialData);
    const score = this.calculateCreditScore(clientProfile, financialData);
    const riskLevel = this.assessRiskLevel(score, clientProfile);

    // Gera análise do Mig
    const migAnalysis = await this.generateMigAnalysis(clientProfile, financialData, reportType);
    
    // Gera plano de ação
    const actionPlan = await this.generateActionPlan(clientProfile, financialData);

    const recommendations = this.generateBrazilianRecommendations(clientProfile, financialData, riskLevel);

    return {
      clientId: clientProfile.id,
      reportType,
      score,
      riskLevel,
      summary: `Análise financeira para ${clientProfile.name}: Score ${score}, Risco ${riskLevel.toUpperCase()}`,
      recommendations,
      actionPlan,
      metrics,
      generatedAt: new Date().toISOString(),
      migAnalysis
    };
  }

  // Métodos auxiliares privados

  private calculateEmergencyFund(profile: ClientProfile): number {
    const essentialExpenses = profile.monthlyIncome * 0.7; // 70% para gastos essenciais
    
    // Multiplicador baseado na estabilidade profissional brasileira
    let multiplier = 6; // Base: 6 meses
    
    if (profile.profession.includes('autônomo') || profile.profession.includes('freelancer')) {
      multiplier = 12; // Autônomos: 12 meses
    } else if (profile.profession.includes('funcionário público')) {
      multiplier = 3; // Funcionários públicos: 3 meses
    } else if (profile.profession.includes('CLT')) {
      multiplier = 6; // CLT: 6 meses
    }

    return essentialExpenses * multiplier;
  }

  private createBrazilianActionPlan(profile: ClientProfile, financialData: any): { steps: ActionStep[], metrics: PlanMetric[] } {
    const steps: ActionStep[] = [];
    const metrics: PlanMetric[] = [];
    const baseId = Date.now();

    // Passo 1: Auditoria Financeira Completa
    steps.push({
      id: `step_${baseId + 1}`,
      title: 'Auditoria Financeira Completa',
      description: 'Mapear todos os gastos, receitas e compromissos financeiros',
      targetDate: this.calculateTargetDate(1),
      completed: false,
      category: 'budget',
      priority: 1,
      estimatedImpact: 9
    });

    // Passo 2: Controle de Gastos Mensais
    steps.push({
      id: `step_${baseId + 2}`,
      title: 'Implementar Controle de Gastos',
      description: 'Estabelecer orçamento mensal com categorias específicas',
      targetDate: this.calculateTargetDate(2),
      completed: false,
      category: 'budget',
      priority: 2,
      estimatedImpact: 8
    });

    // Passo 3: Quitação de Dívidas Caras (se aplicável)
    if (profile.currentDebts > 0) {
      steps.push({
        id: `step_${baseId + 3}`,
        title: 'Negociar e Quitar Dívidas',
        description: 'Priorizar dívidas com juros altos (cartão, cheque especial)',
        targetDate: this.calculateTargetDate(3),
        completed: false,
        category: 'debt',
        priority: 3,
        estimatedImpact: 10
      });
    }

    // Passo 4: Formar Reserva de Emergência
    steps.push({
      id: `step_${baseId + 4}`,
      title: 'Formar Reserva de Emergência',
      description: 'Poupar mensalmente para atingir reserva ideal',
      targetDate: this.calculateTargetDate(6),
      completed: false,
      category: 'saving',
      priority: 4,
      estimatedImpact: 9
    });

    // Passo 5: Educação Financeira
    steps.push({
      id: `step_${baseId + 5}`,
      title: 'Educação Financeira Continuada',
      description: 'Estudar investimentos básicos e planejamento financeiro',
      targetDate: this.calculateTargetDate(3),
      completed: false,
      category: 'education',
      priority: 5,
      estimatedImpact: 7
    });

    // Métricas de acompanhamento
    metrics.push(
      {
        id: `metric_${baseId + 1}`,
        name: 'Taxa de Poupança Mensal',
        currentValue: (profile.currentSavings / profile.monthlyIncome) * 100,
        targetValue: 20, // 20% da renda
        unit: '%',
        measurementDate: new Date().toISOString()
      },
      {
        id: `metric_${baseId + 2}`,
        name: 'Relação Dívida/Renda',
        currentValue: (profile.currentDebts / profile.monthlyIncome) * 100,
        targetValue: 0, // Zero dívidas
        unit: '%',
        measurementDate: new Date().toISOString()
      },
      {
        id: `metric_${baseId + 3}`,
        name: 'Reserva de Emergência (meses)',
        currentValue: profile.emergencyFund / (profile.monthlyIncome * 0.7),
        targetValue: profile.profession.includes('autônomo') ? 12 : 6,
        unit: 'meses',
        measurementDate: new Date().toISOString()
      }
    );

    return { steps, metrics };
  }

  private calculateBrazilianMetrics(profile: ClientProfile, financialData: any): Record<string, number> {
    return {
      creditScore: this.calculateCreditScore(profile, financialData),
      debtToIncomeRatio: (profile.currentDebts / profile.monthlyIncome) * 100,
      savingsRate: (profile.currentSavings / profile.monthlyIncome) * 100,
      emergencyFundMonths: profile.emergencyFund / (profile.monthlyIncome * 0.7),
      financialHealthScore: this.calculateFinancialHealthScore(profile),
      liquidityRatio: this.calculateLiquidityRatio(profile),
      regionalCostOfLiving: this.getRegionalCostIndex(profile.region),
      familyExpenseRatio: this.calculateFamilyExpenseRatio(profile)
    };
  }

  private calculateCreditScore(profile: ClientProfile, financialData: any): number {
    let score = 500; // Base score

    // Fator renda
    if (profile.monthlyIncome >= 10000) score += 150;
    else if (profile.monthlyIncome >= 5000) score += 100;
    else if (profile.monthlyIncome >= 2000) score += 50;

    // Fator dívidas
    const debtRatio = profile.currentDebts / profile.monthlyIncome;
    if (debtRatio === 0) score += 100;
    else if (debtRatio <= 0.3) score += 50;
    else if (debtRatio <= 0.5) score += 0;
    else score -= 100;

    // Fator reserva
    const emergencyMonths = profile.emergencyFund / (profile.monthlyIncome * 0.7);
    if (emergencyMonths >= 6) score += 100;
    else if (emergencyMonths >= 3) score += 50;
    else if (emergencyMonths >= 1) score += 25;

    // Fator idade (experiência financeira)
    if (profile.age >= 35) score += 50;
    else if (profile.age >= 25) score += 25;

    // Fator profissional
    if (profile.profession.includes('funcionário público')) score += 50;
    else if (profile.profession.includes('CLT')) score += 25;

    return Math.min(Math.max(score, 0), 1000); // Entre 0 e 1000
  }

  private assessRiskLevel(score: number, profile: ClientProfile): 'low' | 'medium' | 'high' {
    if (score >= 700) return 'low';
    if (score >= 400) return 'medium';
    return 'high';
  }

  private generateBrazilianRecommendations(
    profile: ClientProfile,
    financialData: any,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas no perfil de risco
    if (riskLevel === 'high') {
      recommendations.push('Priorizar formação de reserva de emergência de R$ 1.000');
      recommendations.push('Renegociar dívidas em feirões ou com desconto à vista');
      recommendations.push('Revisar gastos mensais e cortar supérfluos');
      recommendations.push('Buscar renda extra através de trabalhos complementares');
    }

    if (riskLevel === 'medium') {
      recommendations.push('Expandir reserva de emergência para 3-6 meses de gastos');
      recommendations.push('Considerar investimentos em Tesouro SELIC para liquidez');
      recommendations.push('Implementar controle rigoroso de orçamento mensal');
      recommendations.push('Avaliar seguros básicos (vida, saúde)');
    }

    if (riskLevel === 'low') {
      recommendations.push('Diversificar investimentos em CDB, LCI/LCA');
      recommendations.push('Considerar Tesouro IPCA para proteção inflacionária');
      recommendations.push('Avaliar investimentos em fundos imobiliários');
      recommendations.push('Planejar aposentadoria complementar');
    }

    // Recomendações específicas por região
    const regionalRecommendations = this.getRegionalRecommendations(profile.region);
    recommendations.push(...regionalRecommendations);

    return recommendations;
  }

  private async generateMigAnalysis(
    profile: ClientProfile,
    financialData: any,
    reportType: string
  ): Promise<string> {
    return `
**Análise do Mig - Consultor Financeiro Especializado**

Olá ${profile.name}, sou o Mig, seu consultor financeiro especializado. Após analisar seu perfil e documentos financeiros, aqui está minha avaliação:

**SITUAÇÃO ATUAL:**
- Renda mensal: R$ ${profile.monthlyIncome.toLocaleString('pt-BR')}
- Perfil profissional: ${profile.profession}
- Score de crédito calculado: ${this.calculateCreditScore(profile, financialData)}
- Nível de risco: ${this.assessRiskLevel(this.calculateCreditScore(profile, financialData), profile).toUpperCase()}

**PONTOS FORTES:**
${this.identifyStrengths(profile).map(s => `• ${s}`).join('\n')}

**ÁREAS DE MELHORIA:**
${this.identifyWeaknesses(profile).map(w => `• ${w}`).join('\n')}

**RECOMENDAÇÕES PRIORITÁRIAS:**
${this.generateBrazilianRecommendations(profile, financialData, this.assessRiskLevel(this.calculateCreditScore(profile, financialData), profile)).slice(0, 3).map(r => `• ${r}`).join('\n')}

Estou aqui para ajudá-lo a alcançar seus objetivos financeiros com estratégias práticas e adaptadas à realidade brasileira.

Atenciosamente,
**Mig - Consultor Financeiro**
    `;
  }

  // Métodos auxiliares menores
  private formatCurrentSituation(profile: ClientProfile, financialData: any): string {
    return `Renda: R$ ${profile.monthlyIncome}, Dívidas: R$ ${profile.currentDebts}, Reserva: R$ ${profile.emergencyFund}`;
  }

  private determineTimeframe(profile: ClientProfile): string {
    if (profile.currentDebts > profile.monthlyIncome * 6) return 'long';
    if (profile.emergencyFund < profile.monthlyIncome * 3) return 'medium';
    return 'short';
  }

  private identifyConstraints(profile: ClientProfile): string {
    const constraints = [];
    if (profile.familySize > 2) constraints.push('Família numerosa');
    if (profile.currentDebts > 0) constraints.push('Dívidas pendentes');
    if (profile.monthlyIncome < 3000) constraints.push('Renda limitada');
    return constraints.join(', ') || 'Sem restrições significativas';
  }

  private calculateTargetDate(months: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toISOString().split('T')[0];
  }

  private calculateFinancialHealthScore(profile: ClientProfile): number {
    let score = 50; // Base
    score += (profile.emergencyFund / profile.monthlyIncome) * 10;
    score -= (profile.currentDebts / profile.monthlyIncome) * 20;
    score += (profile.currentSavings / profile.monthlyIncome) * 15;
    return Math.min(Math.max(score, 0), 100);
  }

  private calculateLiquidityRatio(profile: ClientProfile): number {
    const liquidAssets = profile.emergencyFund + profile.currentSavings;
    const monthlyExpenses = profile.monthlyIncome * 0.7;
    return liquidAssets / monthlyExpenses;
  }

  private getRegionalCostIndex(region: string): number {
    const regionCosts: Record<string, number> = {
      'são paulo': 1.2,
      'rio de janeiro': 1.15,
      'distrito federal': 1.1,
      'sul': 1.0,
      'nordeste': 0.8,
      'norte': 0.85,
      'centro-oeste': 0.9
    };
    return regionCosts[region.toLowerCase()] || 1.0;
  }

  private calculateFamilyExpenseRatio(profile: ClientProfile): number {
    // Gastos estimados por pessoa na família
    const baseExpense = 800; // R$ 800 por pessoa
    const totalFamilyExpense = baseExpense * profile.familySize;
    return (totalFamilyExpense / profile.monthlyIncome) * 100;
  }

  private getRegionalRecommendations(region: string): string[] {
    const regionRecommendations: Record<string, string[]> = {
      'nordeste': [
        'Considerar programas governamentais regionais',
        'Avaliar cooperativas de crédito locais'
      ],
      'sul': [
        'Aproveitar incentivos para agricultura familiar',
        'Considerar investimentos em agronegócio'
      ],
      'são paulo': [
        'Avaliar fundos imobiliários devido ao mercado aquecido',
        'Considerar custo de vida elevado no planejamento'
      ]
    };
    return regionRecommendations[region.toLowerCase()] || [];
  }

  private identifyStrengths(profile: ClientProfile): string[] {
    const strengths = [];
    if (profile.emergencyFund > 0) strengths.push('Possui reserva de emergência');
    if (profile.currentDebts === 0) strengths.push('Sem dívidas pendentes');
    if (profile.monthlyIncome >= 5000) strengths.push('Boa capacidade de renda');
    if (profile.age >= 30) strengths.push('Experiência e maturidade financeira');
    return strengths;
  }

  private identifyWeaknesses(profile: ClientProfile): string[] {
    const weaknesses = [];
    if (profile.emergencyFund < profile.monthlyIncome * 3) weaknesses.push('Reserva de emergência insuficiente');
    if (profile.currentDebts > 0) weaknesses.push('Presença de dívidas');
    if (profile.currentSavings < profile.monthlyIncome) weaknesses.push('Baixa capacidade de poupança');
    return weaknesses;
  }
}