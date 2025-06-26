import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";

interface RiskIndicatorsProps {
  indicators: {
    inconsistentIncome: boolean;
    highExpenseRatio: boolean;
    negativeBalance: boolean;
    unusualTransactions: boolean;
    bettingActivity: boolean;
  };
}

export function RiskIndicators({ indicators }: RiskIndicatorsProps) {
  const riskItems = [
    {
      key: 'inconsistentIncome',
      label: 'Consistência de Renda',
      description: 'Renda apresenta padrão regular e previsível',
      value: !indicators.inconsistentIncome,
      risk: indicators.inconsistentIncome
    },
    {
      key: 'expenseControl',
      label: 'Controle de Gastos',
      description: 'Gastos estão proporcionais à renda',
      value: !indicators.highExpenseRatio,
      risk: indicators.highExpenseRatio
    },
    {
      key: 'balanceStability',
      label: 'Estabilidade do Saldo',
      description: 'Histórico de manutenção de saldo positivo',
      value: !indicators.negativeBalance,
      risk: indicators.negativeBalance
    },
    {
      key: 'transactionPattern',
      label: 'Padrão de Transações',
      description: 'Transações dentro do padrão esperado',
      value: !indicators.unusualTransactions,
      risk: indicators.unusualTransactions
    },
    {
      key: 'bettingBehavior',
      label: 'Atividade de Apostas',
      description: 'Ausência de movimentações relacionadas a jogos',
      value: !indicators.bettingActivity,
      risk: indicators.bettingActivity
    }
  ];

  const riskCount = Object.values(indicators).filter(Boolean).length;
  const totalIndicators = Object.keys(indicators).length;
  const riskPercentage = (riskCount / totalIndicators) * 100;
  
  const getRiskLevel = () => {
    if (riskCount === 0) return { level: 'Baixo', color: 'text-success-600', bgColor: 'bg-success-50' };
    if (riskCount <= 2) return { level: 'Médio', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'Alto', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const riskLevel = getRiskLevel();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Indicadores de Risco</span>
        </CardTitle>
        <CardDescription>
          Análise detalhada dos fatores que influenciam o score de crédito
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Level Summary */}
        <div className="flex items-center justify-between p-4 rounded-lg border">
          <div>
            <h4 className="font-medium text-foreground">Nível de Risco Geral</h4>
            <p className="text-sm text-muted-foreground">
              {riskCount} de {totalIndicators} indicadores de risco identificados
            </p>
          </div>
          <Badge className={`${riskLevel.color} ${riskLevel.bgColor} border-0`}>
            {riskLevel.level}
          </Badge>
        </div>

        {/* Risk Progress Bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Índice de Risco</span>
            <span className={`text-sm font-medium ${riskLevel.color}`}>
              {riskPercentage.toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={riskPercentage} 
            className={`h-3 ${
              riskPercentage <= 20 ? '[&>div]:bg-success-500' :
              riskPercentage <= 40 ? '[&>div]:bg-yellow-500' :
              '[&>div]:bg-red-500'
            }`}
          />
        </div>

        {/* Individual Risk Indicators */}
        <div className="space-y-3">
          {riskItems.map((item) => {
            const score = item.value ? 85 : 35; // High score for good indicators
            
            return (
              <div key={item.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {item.value ? (
                      <CheckCircle className="h-4 w-4 text-success-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${
                      item.value ? 'text-success-600' : 'text-red-600'
                    }`}>
                      {score}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={score} 
                  className={`h-2 ${
                    item.value ? '[&>div]:bg-success-500' : '[&>div]:bg-red-500'
                  }`}
                />
                <p className="text-xs text-muted-foreground ml-6">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Additional Risk Information */}
        {riskCount > 0 && (
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-foreground">Atenção aos Riscos</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Os indicadores de risco identificados podem impactar negativamente 
                  sua capacidade de obter crédito. Recomendamos revisar as sugestões 
                  de melhoria apresentadas no relatório.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
