/**
 * Financial Consultancy Component
 * Interface para consultoria financeira, planos de ação e metas inteligentes
 */

import React, { useState, useEffect } from 'react';
import { FinancialConsultant, ClientProfile, FinancialGoal, ActionPlan, ConsultancyReport } from '../consultancy/financial-consultant';
import { SmartGoalsEngine, GoalProgress, GoalAchievement } from '../consultancy/smart-goals-engine';

interface FinancialConsultancyProps {
  userId: string;
  className?: string;
}

interface ConsultancyState {
  clientProfile: ClientProfile | null;
  goals: FinancialGoal[];
  actionPlans: ActionPlan[];
  reports: ConsultancyReport[];
  loading: boolean;
  activeTab: 'overview' | 'goals' | 'plans' | 'reports';
}

export const FinancialConsultancy: React.FC<FinancialConsultancyProps> = ({
  userId,
  className = ""
}) => {
  const [state, setState] = useState<ConsultancyState>({
    clientProfile: null,
    goals: [],
    actionPlans: [],
    reports: [],
    loading: true,
    activeTab: 'overview'
  });

  const [consultant] = useState(() => new FinancialConsultant());
  const [goalsEngine] = useState(() => new SmartGoalsEngine());

  useEffect(() => {
    loadConsultancyData();
  }, [userId]);

  const loadConsultancyData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    
    try {
      // Simula carregamento de dados do usuário
      const mockProfile: ClientProfile = {
        id: userId,
        name: "Cliente Exemplo",
        age: 35,
        monthlyIncome: 5000,
        familySize: 3,
        region: "São Paulo",
        profession: "Analista CLT",
        riskProfile: "moderate",
        financialGoals: ["Reserva de emergência", "Casa própria", "Aposentadoria"],
        currentDebts: 2000,
        currentSavings: 1500,
        emergencyFund: 800
      };

      const goals = await goalsEngine.generateSmartGoals(mockProfile);
      const actionPlan = await consultant.generateActionPlan(mockProfile, {});
      const report = await consultant.generateConsultancyReport(mockProfile, {});

      setState({
        clientProfile: mockProfile,
        goals,
        actionPlans: [actionPlan],
        reports: [report],
        loading: false,
        activeTab: 'overview'
      });
    } catch (error) {
      console.error('Erro ao carregar dados de consultoria:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const updateGoalProgress = async (goalId: string, newAmount: number) => {
    const goal = state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const progress = goalsEngine.trackGoalProgress(goal, newAmount);
    
    // Atualiza o estado local
    setState(prev => ({
      ...prev,
      goals: prev.goals.map(g => 
        g.id === goalId 
          ? { ...g, currentAmount: newAmount }
          : g
      )
    }));
  };

  const generateNewReport = async () => {
    if (!state.clientProfile) return;

    setState(prev => ({ ...prev, loading: true }));
    
    try {
      const newReport = await consultant.generateConsultancyReport(
        state.clientProfile!,
        {},
        'financial_planning'
      );

      setState(prev => ({
        ...prev,
        reports: [newReport, ...prev.reports],
        loading: false
      }));
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  if (state.loading) {
    return (
      <div className={`${className} flex items-center justify-center p-8`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        <span className="ml-3 text-gray-600">Carregando consultoria financeira...</span>
      </div>
    );
  }

  return (
    <div className={`${className} bg-white dark:bg-gray-800 rounded-3xl p-6 space-y-6`}>
      {/* Header com Mig */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">Mig</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Consultoria Financeira
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Seu consultor especializado em finanças brasileiras
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-3xl p-1">
        {[
          { key: 'overview', label: 'Visão Geral' },
          { key: 'goals', label: 'Metas' },
          { key: 'plans', label: 'Planos de Ação' },
          { key: 'reports', label: 'Relatórios' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setState(prev => ({ ...prev, activeTab: tab.key as any }))}
            className={`flex-1 py-2 px-4 rounded-3xl text-sm font-medium transition-colors ${
              state.activeTab === tab.key
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {state.activeTab === 'overview' && (
          <OverviewTab 
            profile={state.clientProfile}
            goals={state.goals}
            plans={state.actionPlans}
            onGenerateReport={generateNewReport}
          />
        )}

        {state.activeTab === 'goals' && (
          <GoalsTab 
            goals={state.goals}
            onUpdateProgress={updateGoalProgress}
            goalsEngine={goalsEngine}
          />
        )}

        {state.activeTab === 'plans' && (
          <PlansTab 
            plans={state.actionPlans}
            profile={state.clientProfile}
          />
        )}

        {state.activeTab === 'reports' && (
          <ReportsTab 
            reports={state.reports}
            onGenerateNew={generateNewReport}
          />
        )}
      </div>
    </div>
  );
};

// Sub-componentes

const OverviewTab: React.FC<{
  profile: ClientProfile | null;
  goals: FinancialGoal[];
  plans: ActionPlan[];
  onGenerateReport: () => void;
}> = ({ profile, goals, plans, onGenerateReport }) => {
  if (!profile) return <div>Carregando perfil...</div>;

  const creditScore = calculateMockCreditScore(profile);
  const riskLevel = creditScore >= 700 ? 'Baixo' : creditScore >= 400 ? 'Médio' : 'Alto';

  return (
    <div className="space-y-6">
      {/* Score e Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Score de Crédito</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{creditScore}</p>
          <p className="text-sm text-gray-500">Risco: {riskLevel}</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Metas Ativas</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{goals.length}</p>
          <p className="text-sm text-gray-500">Em andamento</p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Renda Mensal</h3>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            R$ {profile.monthlyIncome.toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-gray-500">{profile.profession}</p>
        </div>
      </div>

      {/* Análise do Mig */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-3xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">Mig</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Análise Personalizada
          </h3>
        </div>
        
        <div className="prose prose-sm dark:prose-invert">
          <p>Olá {profile.name}! Após analisar seu perfil financeiro, aqui estão minhas principais observações:</p>
          
          <div className="mt-4 space-y-2">
            <div className="flex items-start space-x-2">
              <span className="text-green-500">✓</span>
              <span>Renda estável como {profile.profession}</span>
            </div>
            {profile.emergencyFund > 0 && (
              <div className="flex items-start space-x-2">
                <span className="text-green-500">✓</span>
                <span>Já possui reserva de emergência iniciada</span>
              </div>
            )}
            {profile.currentDebts > 0 && (
              <div className="flex items-start space-x-2">
                <span className="text-yellow-500">⚠</span>
                <span>Dívidas pendentes de R$ {profile.currentDebts.toLocaleString('pt-BR')}</span>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onGenerateReport}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-3xl text-sm font-medium transition-colors"
        >
          Gerar Relatório Completo
        </button>
      </div>
    </div>
  );
};

const GoalsTab: React.FC<{
  goals: FinancialGoal[];
  onUpdateProgress: (goalId: string, amount: number) => void;
  goalsEngine: SmartGoalsEngine;
}> = ({ goals, onUpdateProgress, goalsEngine }) => {
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [progressAmount, setProgressAmount] = useState('');

  const handleUpdateProgress = () => {
    if (selectedGoal && progressAmount) {
      onUpdateProgress(selectedGoal.id, parseFloat(progressAmount));
      setSelectedGoal(null);
      setProgressAmount('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suas Metas Financeiras</h2>
        <span className="text-sm text-gray-500">{goals.length} metas ativas</span>
      </div>

      {goals.map(goal => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        
        return (
          <div key={goal.id} className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{goal.description}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                goal.priority === 'high' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                  : goal.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}>
                {goal.priority === 'high' ? 'Alta' : goal.priority === 'medium' ? 'Média' : 'Baixa'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Progresso</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {progress.toFixed(1)}%
                </span>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>R$ {goal.currentAmount.toLocaleString('pt-BR')}</span>
                <span>R$ {goal.targetAmount.toLocaleString('pt-BR')}</span>
              </div>
              
              <button
                onClick={() => setSelectedGoal(goal)}
                className="w-full mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Atualizar Progresso
              </button>
            </div>
          </div>
        );
      })}

      {/* Modal para atualizar progresso */}
      {selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Atualizar: {selectedGoal.title}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valor Atual (R$)
                </label>
                <input
                  type="number"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Digite o valor atual"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedGoal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-3xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateProgress}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl"
                >
                  Atualizar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PlansTab: React.FC<{
  plans: ActionPlan[];
  profile: ClientProfile | null;
}> = ({ plans, profile }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Planos de Ação</h2>
      
      {plans.map(plan => (
        <div key={plan.id} className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{plan.title}</h3>
            <p className="text-gray-600 dark:text-gray-300">{plan.description}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 dark:text-white">Próximas Ações:</h4>
            
            {plan.steps.slice(0, 5).map((step, index) => (
              <div key={step.id} className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded-2xl">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                    {step.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {step.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Prazo: {new Date(step.targetDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Impact: {step.estimatedImpact}/10
                  </span>
                </div>
              </div>
            ))}
          </div>

          {plan.metrics.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Métricas de Acompanhamento:</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plan.metrics.map(metric => (
                  <div key={metric.id} className="bg-white dark:bg-gray-800 rounded-2xl p-3">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                      {metric.name}
                    </h5>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {metric.currentValue.toFixed(1)}{metric.unit}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Meta: {metric.targetValue}{metric.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ReportsTab: React.FC<{
  reports: ConsultancyReport[];
  onGenerateNew: () => void;
}> = ({ reports, onGenerateNew }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Relatórios de Consultoria</h2>
        <button
          onClick={onGenerateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-3xl text-sm font-medium"
        >
          Gerar Novo Relatório
        </button>
      </div>

      {reports.map(report => (
        <div key={report.generatedAt} className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Relatório de {report.reportType === 'financial_planning' ? 'Planejamento' : 'Análise'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Gerado em {new Date(report.generatedAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {report.score}
              </div>
              <div className={`text-sm font-medium ${
                report.riskLevel === 'low' 
                  ? 'text-green-600 dark:text-green-400'
                  : report.riskLevel === 'medium'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                Risco {report.riskLevel === 'low' ? 'Baixo' : report.riskLevel === 'medium' ? 'Médio' : 'Alto'}
              </div>
            </div>
          </div>

          <div className="prose prose-sm dark:prose-invert">
            <p>{report.summary}</p>
          </div>

          <div className="mt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Recomendações:</h4>
            <ul className="space-y-1">
              {report.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start space-x-2">
                  <span className="text-blue-600">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {report.migAnalysis && (
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">Mig</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Análise Especializada
                </span>
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {report.migAnalysis.substring(0, 200)}...
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Função auxiliar para calcular score mockado
function calculateMockCreditScore(profile: ClientProfile): number {
  let score = 500;
  
  if (profile.monthlyIncome >= 5000) score += 100;
  if (profile.currentDebts === 0) score += 100;
  if (profile.emergencyFund > 0) score += 50;
  if (profile.age >= 30) score += 50;
  
  return Math.min(score, 850);
}

export default FinancialConsultancy;