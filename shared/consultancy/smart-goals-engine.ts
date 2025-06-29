/**
 * Smart Goals Engine - Sistema de Metas Financeiras Inteligentes
 * Gera e acompanha metas SMART adaptadas ao mercado brasileiro
 */

import { ClientProfile, FinancialGoal, ActionPlan } from './financial-consultant';
import { getMigPrompt } from '../prompts/mig-agent-prompts';

export interface SmartGoalTemplate {
  id: string;
  category: 'emergency' | 'debt' | 'savings' | 'investment' | 'purchase' | 'retirement';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  timeframe: 'short' | 'medium' | 'long';
  targetPercentage: number; // % da renda mensal
  minimumAmount: number;
  maximumAmount: number;
  brazilianContext: string;
}

export interface GoalProgress {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  estimatedCompletion: string;
  weeklyTarget: number;
  monthlyTarget: number;
  status: 'on_track' | 'ahead' | 'behind' | 'at_risk';
  motivationalMessage: string;
}

export interface GoalAchievement {
  id: string;
  goalId: string;
  achievedAt: string;
  actualAmount: number;
  targetAmount: number;
  daysTaken: number;
  celebrationMessage: string;
  nextSuggestedGoal?: string;
}

export class SmartGoalsEngine {
  private goalTemplates: SmartGoalTemplate[] = [
    {
      id: 'emergency_basic',
      category: 'emergency',
      title: 'Reserva de Emergência Básica',
      description: 'Formar reserva inicial de segurança financeira',
      priority: 'high',
      timeframe: 'short',
      targetPercentage: 0.7, // 70% da renda para 3 meses
      minimumAmount: 1000,
      maximumAmount: 50000,
      brazilianContext: 'Considerando instabilidade econômica brasileira'
    },
    {
      id: 'debt_freedom',
      category: 'debt',
      title: 'Liberdade das Dívidas',
      description: 'Quitar todas as dívidas pendentes',
      priority: 'high',
      timeframe: 'medium',
      targetPercentage: 0.3, // 30% da renda para quitação
      minimumAmount: 500,
      maximumAmount: 100000,
      brazilianContext: 'Foco em dívidas com juros altos (cartão, cheque especial)'
    },
    {
      id: 'investment_start',
      category: 'investment',
      title: 'Primeiros Investimentos',
      description: 'Começar a investir para o futuro',
      priority: 'medium',
      timeframe: 'medium',
      targetPercentage: 0.1, // 10% da renda
      minimumAmount: 100,
      maximumAmount: 20000,
      brazilianContext: 'Começar com Tesouro Direto e CDB'
    },
    {
      id: 'home_purchase',
      category: 'purchase',
      title: 'Entrada para Casa Própria',
      description: 'Juntar entrada para financiamento imobiliário',
      priority: 'medium',
      timeframe: 'long',
      targetPercentage: 0.15, // 15% da renda
      minimumAmount: 20000,
      maximumAmount: 200000,
      brazilianContext: 'Considerando programas habitacionais brasileiros'
    },
    {
      id: 'retirement_basic',
      category: 'retirement',
      title: 'Aposentadoria Complementar',
      description: 'Formar reserva para aposentadoria',
      priority: 'low',
      timeframe: 'long',
      targetPercentage: 0.05, // 5% da renda
      minimumAmount: 1000,
      maximumAmount: 500000,
      brazilianContext: 'Complementar INSS com previdência privada'
    }
  ];

  constructor() {
    console.log('🎯 Smart Goals Engine initialized - Brazilian Context v1.0');
  }

  /**
   * Gera metas inteligentes baseadas no perfil do cliente
   */
  async generateSmartGoals(clientProfile: ClientProfile): Promise<FinancialGoal[]> {
    const goals: FinancialGoal[] = [];
    const currentDate = new Date();

    // Analisa situação atual e prioriza metas
    const prioritizedTemplates = this.prioritizeGoalsForClient(clientProfile);

    for (const template of prioritizedTemplates) {
      const goal = await this.createGoalFromTemplate(template, clientProfile, currentDate);
      if (goal) {
        goals.push(goal);
      }
    }

    return goals;
  }

  /**
   * Acompanha progresso de uma meta específica
   */
  trackGoalProgress(goal: FinancialGoal, currentAmount: number): GoalProgress {
    const progress = (currentAmount / goal.targetAmount) * 100;
    const remaining = goal.targetAmount - currentAmount;
    const targetDate = new Date(goal.targetDate);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calcula metas semanais e mensais
    const weeksRemaining = Math.max(1, Math.ceil(daysRemaining / 7));
    const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
    
    const weeklyTarget = remaining / weeksRemaining;
    const monthlyTarget = remaining / monthsRemaining;

    // Determina status baseado no progresso esperado
    const expectedProgress = this.calculateExpectedProgress(goal, today);
    let status: GoalProgress['status'] = 'on_track';
    
    if (progress >= expectedProgress + 10) status = 'ahead';
    else if (progress < expectedProgress - 20) status = 'at_risk';
    else if (progress < expectedProgress - 10) status = 'behind';

    // Gera mensagem motivacional
    const motivationalMessage = this.generateMotivationalMessage(goal, progress, status);

    // Estima data de conclusão baseada no ritmo atual
    const estimatedCompletion = this.estimateCompletionDate(goal, currentAmount, today);

    return {
      goalId: goal.id,
      currentAmount,
      targetAmount: goal.targetAmount,
      progressPercentage: Math.round(progress),
      remainingAmount: remaining,
      estimatedCompletion,
      weeklyTarget: Math.round(weeklyTarget),
      monthlyTarget: Math.round(monthlyTarget),
      status,
      motivationalMessage
    };
  }

  /**
   * Registra conquista de meta
   */
  recordAchievement(goal: FinancialGoal, actualAmount: number): GoalAchievement {
    const createdDate = new Date(goal.createdAt);
    const achievedDate = new Date();
    const daysTaken = Math.ceil((achievedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

    const celebrationMessage = this.generateCelebrationMessage(goal, actualAmount, daysTaken);
    const nextSuggestedGoal = this.suggestNextGoal(goal);

    return {
      id: `achievement_${Date.now()}`,
      goalId: goal.id,
      achievedAt: achievedDate.toISOString(),
      actualAmount,
      targetAmount: goal.targetAmount,
      daysTaken,
      celebrationMessage,
      nextSuggestedGoal
    };
  }

  /**
   * Sugere ajustes em metas baseado no progresso
   */
  suggestGoalAdjustments(goal: FinancialGoal, progress: GoalProgress, clientProfile: ClientProfile): string[] {
    const suggestions: string[] = [];

    if (progress.status === 'at_risk') {
      suggestions.push('Considere reduzir o valor da meta em 20% para torná-la mais realista');
      suggestions.push('Estenda o prazo por mais 2-3 meses para reduzir pressão');
      suggestions.push('Revise seus gastos mensais para encontrar mais recursos');
    }

    if (progress.status === 'behind') {
      suggestions.push('Aumente seu esforço de poupança em R$ 100-200 mensais');
      suggestions.push('Considere uma renda extra temporária para acelerar o progresso');
      suggestions.push('Revise categorias de gastos não essenciais');
    }

    if (progress.status === 'ahead') {
      suggestions.push('Parabéns! Considere aumentar a meta em 10-15%');
      suggestions.push('Você pode acelerar a próxima meta do seu plano');
      suggestions.push('Mantenha esse ritmo excelente de poupança');
    }

    // Sugestões específicas por categoria
    if (goal.category === 'emergency') {
      suggestions.push('Mantenha a reserva em investimentos de liquidez diária (poupança, CDB liquidez diária)');
    } else if (goal.category === 'investment') {
      suggestions.push('Considere aumentar gradualmente o percentual em investimentos de maior rentabilidade');
    }

    return suggestions;
  }

  /**
   * Gera plano de ação para alcançar meta
   */
  generateGoalActionPlan(goal: FinancialGoal, clientProfile: ClientProfile): ActionPlan {
    const steps = [];
    const metrics = [];
    const baseId = Date.now();

    // Passos específicos por categoria de meta
    if (goal.category === 'emergency') {
      steps.push({
        id: `step_${baseId + 1}`,
        title: 'Abrir conta para reserva',
        description: 'Abrir poupança ou CDB com liquidez diária',
        targetDate: this.addDaysToDate(new Date(), 7),
        completed: false,
        category: 'saving' as const,
        priority: 1,
        estimatedImpact: 8
      });

      steps.push({
        id: `step_${baseId + 2}`,
        title: 'Automatizar transferência',
        description: 'Configurar transferência automática mensal para reserva',
        targetDate: this.addDaysToDate(new Date(), 14),
        completed: false,
        category: 'saving' as const,
        priority: 2,
        estimatedImpact: 9
      });
    }

    if (goal.category === 'debt') {
      steps.push({
        id: `step_${baseId + 1}`,
        title: 'Listar todas as dívidas',
        description: 'Mapear valor, juros e condições de cada dívida',
        targetDate: this.addDaysToDate(new Date(), 3),
        completed: false,
        category: 'debt' as const,
        priority: 1,
        estimatedImpact: 10
      });

      steps.push({
        id: `step_${baseId + 2}`,
        title: 'Negociar condições',
        description: 'Renegociar juros e prazos com credores',
        targetDate: this.addDaysToDate(new Date(), 21),
        completed: false,
        category: 'debt' as const,
        priority: 2,
        estimatedImpact: 9
      });
    }

    // Métricas de acompanhamento
    metrics.push({
      id: `metric_${baseId + 1}`,
      name: 'Progresso da Meta',
      currentValue: goal.currentAmount,
      targetValue: goal.targetAmount,
      unit: 'R$',
      measurementDate: new Date().toISOString()
    });

    return {
      id: `plan_${Date.now()}`,
      clientId: clientProfile.id,
      goalId: goal.id,
      title: `Plano para ${goal.title}`,
      description: goal.description,
      timeframe: this.determineTimeframe(goal.targetDate),
      steps,
      metrics,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  // Métodos privados auxiliares

  private prioritizeGoalsForClient(clientProfile: ClientProfile): SmartGoalTemplate[] {
    const templates = [...this.goalTemplates];
    
    // Prioriza baseado na situação atual
    return templates.sort((a, b) => {
      // Reserva de emergência sempre primeiro se não existe
      if (a.category === 'emergency' && clientProfile.emergencyFund < 1000) return -1;
      if (b.category === 'emergency' && clientProfile.emergencyFund < 1000) return 1;
      
      // Dívidas têm prioridade se existem
      if (a.category === 'debt' && clientProfile.currentDebts > 0) return -1;
      if (b.category === 'debt' && clientProfile.currentDebts > 0) return 1;
      
      // Por prioridade padrão
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  private async createGoalFromTemplate(
    template: SmartGoalTemplate,
    clientProfile: ClientProfile,
    currentDate: Date
  ): Promise<FinancialGoal | null> {
    // Calcula valor da meta baseado na renda
    const targetAmount = this.calculateTargetAmount(template, clientProfile);
    
    // Verifica se a meta é relevante para o cliente
    if (!this.isGoalRelevant(template, clientProfile, targetAmount)) {
      return null;
    }

    // Calcula data alvo baseada no timeframe
    const targetDate = this.calculateTargetDate(template.timeframe, currentDate);

    return {
      id: `goal_${Date.now()}_${template.id}`,
      clientId: clientProfile.id,
      title: template.title,
      description: `${template.description} - ${template.brazilianContext}`,
      targetAmount,
      currentAmount: this.getCurrentAmount(template, clientProfile),
      targetDate: targetDate.toISOString().split('T')[0],
      priority: template.priority,
      category: template.category,
      status: 'active',
      createdAt: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    };
  }

  private calculateTargetAmount(template: SmartGoalTemplate, clientProfile: ClientProfile): number {
    let amount = clientProfile.monthlyIncome * template.targetPercentage;
    
    // Ajustes específicos por categoria
    if (template.category === 'emergency') {
      // Multiplicador baseado na estabilidade profissional
      let multiplier = 3; // Base: 3 meses
      if (clientProfile.profession.includes('autônomo')) multiplier = 6;
      else if (clientProfile.profession.includes('CLT')) multiplier = 4;
      
      amount = (clientProfile.monthlyIncome * 0.7) * multiplier;
    } else if (template.category === 'debt') {
      amount = clientProfile.currentDebts;
    } else if (template.category === 'investment') {
      amount = clientProfile.monthlyIncome * 0.1 * 12; // 10% ao ano
    }

    // Aplica limites mínimos e máximos
    amount = Math.max(template.minimumAmount, amount);
    amount = Math.min(template.maximumAmount, amount);

    return Math.round(amount);
  }

  private isGoalRelevant(template: SmartGoalTemplate, clientProfile: ClientProfile, targetAmount: number): boolean {
    // Verifica se a meta faz sentido para o cliente
    if (template.category === 'debt' && clientProfile.currentDebts === 0) return false;
    if (template.category === 'emergency' && clientProfile.emergencyFund >= targetAmount) return false;
    if (targetAmount < template.minimumAmount) return false;
    
    return true;
  }

  private getCurrentAmount(template: SmartGoalTemplate, clientProfile: ClientProfile): number {
    switch (template.category) {
      case 'emergency': return clientProfile.emergencyFund;
      case 'debt': return 0; // Progresso na quitação
      case 'investment':
      case 'savings': return clientProfile.currentSavings;
      default: return 0;
    }
  }

  private calculateTargetDate(timeframe: string, currentDate: Date): Date {
    const targetDate = new Date(currentDate);
    
    switch (timeframe) {
      case 'short': // 1-6 meses
        targetDate.setMonth(targetDate.getMonth() + 6);
        break;
      case 'medium': // 6-24 meses
        targetDate.setMonth(targetDate.getMonth() + 18);
        break;
      case 'long': // 24+ meses
        targetDate.setFullYear(targetDate.getFullYear() + 3);
        break;
    }
    
    return targetDate;
  }

  private calculateExpectedProgress(goal: FinancialGoal, currentDate: Date): number {
    const startDate = new Date(goal.createdAt);
    const endDate = new Date(goal.targetDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const elapsedDays = Math.ceil((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, Math.min(100, (elapsedDays / totalDays) * 100));
  }

  private generateMotivationalMessage(goal: FinancialGoal, progress: number, status: string): string {
    const messages = {
      ahead: [
        '🎉 Você está indo muito bem! Continue assim!',
        '🚀 Ritmo excelente! Você pode até antecipar sua meta!',
        '⭐ Parabéns pelo progresso excepcional!'
      ],
      on_track: [
        '👍 Você está no caminho certo! Continue firme!',
        '📈 Progresso consistente! Mantenha o foco!',
        '🎯 No alvo! Sua disciplina está dando resultado!'
      ],
      behind: [
        '💪 Não desista! Pequenos ajustes podem fazer a diferença!',
        '🔄 Hora de revisar a estratégia e retomar o ritmo!',
        '⚡ Você consegue! Foque nas próximas semanas!'
      ],
      at_risk: [
        '🚨 Atenção! Vamos ajustar o plano para você conseguir!',
        '🛠️ Hora de repensar a meta. Vamos torná-la mais realista!',
        '💡 Que tal uma estratégia diferente? Estou aqui para ajudar!'
      ]
    };

    const categoryMessages = messages[status as keyof typeof messages];
    return categoryMessages[Math.floor(Math.random() * categoryMessages.length)];
  }

  private estimateCompletionDate(goal: FinancialGoal, currentAmount: number, today: Date): string {
    const remaining = goal.targetAmount - currentAmount;
    const elapsedDays = Math.ceil((today.getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    const averageDaily = currentAmount / Math.max(1, elapsedDays);
    
    if (averageDaily <= 0) return goal.targetDate;
    
    const daysToComplete = Math.ceil(remaining / averageDaily);
    const estimatedDate = new Date(today);
    estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);
    
    return estimatedDate.toISOString().split('T')[0];
  }

  private generateCelebrationMessage(goal: FinancialGoal, actualAmount: number, daysTaken: number): string {
    const category = goal.category;
    const baseMessages = {
      emergency: '🛡️ Parabéns! Sua segurança financeira foi estabelecida!',
      debt: '🎊 Liberdade financeira conquistada! Sem mais dívidas!',
      savings: '💰 Meta de poupança alcançada! Você é um poupador disciplinado!',
      investment: '📈 Primeira conquista como investidor! Seu dinheiro agora trabalha para você!',
      purchase: '🏠 Sonho realizado! Sua disciplina trouxe resultados concretos!',
      retirement: '⏰ Pensando no futuro! Sua aposentadoria agradece!'
    };

    const ahead = daysTaken < (new Date(goal.targetDate).getTime() - new Date(goal.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    const timeMessage = ahead ? ` E ainda por cima, você terminou ${Math.abs(daysTaken)} dias antes do prazo!` : '';
    
    return baseMessages[category] + timeMessage;
  }

  private suggestNextGoal(achievedGoal: FinancialGoal): string {
    const suggestions = {
      emergency: 'Agora que você tem segurança, que tal começar a investir?',
      debt: 'Livre das dívidas! Hora de formar sua reserva de emergência!',
      savings: 'Com o hábito de poupar, considere diversificar em investimentos!',
      investment: 'Parabéns! Que tal aumentar o valor dos aportes mensais?',
      purchase: 'Meta conquistada! Hora de planejar o próximo grande objetivo!',
      retirement: 'Excelente! Considere aumentar sua contribuição previdenciária!'
    };

    return suggestions[achievedGoal.category];
  }

  private determineTimeframe(targetDate: string): 'short' | 'medium' | 'long' {
    const today = new Date();
    const target = new Date(targetDate);
    const monthsDiff = (target.getFullYear() - today.getFullYear()) * 12 + target.getMonth() - today.getMonth();
    
    if (monthsDiff <= 6) return 'short';
    if (monthsDiff <= 24) return 'medium';
    return 'long';
  }

  private addDaysToDate(date: Date, days: number): string {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    return newDate.toISOString().split('T')[0];
  }
}