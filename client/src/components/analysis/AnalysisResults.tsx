import { type FinancialAnalysisResult } from "@/types";
import { RiskIndicators } from "./RiskIndicators";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  formatCurrency, 
  getScoreColor, 
  getScoreDescription, 
  getRiskLevelColor 
} from "@/lib/authUtils";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  FileText, 
  Download, 
  BarChart3 
} from "lucide-react";

interface AnalysisResultsProps {
  results: FinancialAnalysisResult;
}

export function AnalysisResults({ results }: AnalysisResultsProps) {
  const handleGenerateReport = () => {
    // TODO: Implement report generation
    console.log("Generate report for:", results);
  };

  const handleExportPdf = () => {
    // TODO: Implement PDF export
    console.log("Export PDF for:", results);
  };

  const handleGenerateCharts = () => {
    // TODO: Implement chart generation
    console.log("Generate charts for:", results);
  };

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Resumo da Análise</span>
          </CardTitle>
          <CardDescription>
            Visão geral dos resultados financeiros processados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total de Entradas</p>
              <p className="font-semibold text-success-600">
                {formatCurrency(results.totalIncome)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Total de Saídas</p>
              <p className="font-semibold text-red-600">
                {formatCurrency(results.totalExpenses)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Saldo Final</p>
              <p className={`font-semibold ${
                results.netBalance >= 0 ? 'text-success-600' : 'text-red-600'
              }`}>
                {formatCurrency(results.netBalance)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Score Calculado</p>
              <div className="flex items-center space-x-2">
                <p className={`font-semibold ${getScoreColor(results.creditScore)}`}>
                  {results.creditScore}
                </p>
                <Badge 
                  variant="secondary" 
                  className={getRiskLevelColor(results.riskLevel)}
                >
                  {getScoreDescription(results.creditScore)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Credit Score Progress */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Score de Crédito</span>
              <span className={`text-sm font-medium ${getScoreColor(results.creditScore)}`}>
                {results.creditScore}/850
              </span>
            </div>
            <Progress 
              value={(results.creditScore / 850) * 100} 
              className="h-3"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Alerts */}
      {(results.bettingDetection.detected || results.alerts.length > 0) && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-yellow-800 dark:text-yellow-200">
              <AlertTriangle className="h-5 w-5" />
              <span>Alertas Identificados</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.bettingDetection.detected && (
                <div className="flex items-start space-x-2">
                  <span className="material-icon text-yellow-600 text-sm mt-0.5">warning</span>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {results.bettingDetection.transactionCount} transações de apostas detectadas 
                    totalizando {formatCurrency(results.bettingDetection.totalAmount)}
                  </p>
                </div>
              )}
              {results.alerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="material-icon text-yellow-600 text-sm mt-0.5">info</span>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {alert}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Indicators */}
      <RiskIndicators indicators={results.riskIndicators} />

      {/* Category Breakdown */}
      {Object.keys(results.categoryBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Análise detalhada dos gastos por categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(results.categoryBreakdown)
                .sort(([,a], [,b]) => b.amount - a.amount)
                .slice(0, 8) // Show top 8 categories
                .map(([category, data]) => {
                  const percentage = (data.amount / results.totalExpenses) * 100;
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{category}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-muted-foreground">
                            {data.count} transações
                          </span>
                          <span className="font-medium">
                            {formatCurrency(data.amount)}
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-success-500" />
              <span>Recomendações</span>
            </CardTitle>
            <CardDescription>
              Sugestões para melhorar seu perfil financeiro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {results.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="material-icon text-success-500 text-sm mt-0.5">
                    check_circle
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {recommendation}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button 
          onClick={handleGenerateReport}
          className="bg-primary hover:bg-primary/90"
        >
          <FileText className="h-4 w-4 mr-2" />
          Ver Relatório Completo
        </Button>
        <Button 
          variant="outline"
          onClick={handleExportPdf}
        >
          <Download className="h-4 w-4 mr-2" />
          Exportar PDF
        </Button>
        <Button 
          variant="outline"
          onClick={handleGenerateCharts}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Gerar Gráficos
        </Button>
      </div>
    </div>
  );
}
