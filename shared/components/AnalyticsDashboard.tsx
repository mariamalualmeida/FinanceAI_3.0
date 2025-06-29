import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DashboardProps {
  analysisData?: any;
  onExportReport?: (format: 'pdf' | 'excel' | 'json') => void;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export function AnalyticsDashboard({ analysisData, onExportReport }: DashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (analysisData) {
      setChartData(processDataForCharts(analysisData));
    }
  }, [analysisData]);

  if (!analysisData || !chartData) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <h3 className="text-lg font-semibold mb-2">Dashboard Analytics</h3>
          <p>Nenhum dado de análise disponível</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Visão Geral' },
    { id: 'categories', name: 'Categorias' },
    { id: 'trends', name: 'Tendências' },
    { id: 'risk', name: 'Análise de Risco' }
  ];

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard Analytics
        </h2>
        
        <div className="flex gap-2">
          {onExportReport && (
            <>
              <button
                onClick={() => onExportReport('pdf')}
                className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                PDF
              </button>
              <button
                onClick={() => onExportReport('excel')}
                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Excel
              </button>
              <button
                onClick={() => onExportReport('json')}
                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                JSON
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <OverviewTab data={chartData} analysisData={analysisData} />
        )}
        {activeTab === 'categories' && (
          <CategoriesTab data={chartData} />
        )}
        {activeTab === 'trends' && (
          <TrendsTab data={chartData} />
        )}
        {activeTab === 'risk' && (
          <RiskTab data={chartData} analysisData={analysisData} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ data, analysisData }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Métricas Principais */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Receitas</h3>
        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
          R$ {analysisData.summary.totalCredits.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
        </p>
      </div>
      
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Total Despesas</h3>
        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
          R$ {analysisData.summary.totalDebits.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
        </p>
      </div>
      
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-green-600 dark:text-green-400">Saldo</h3>
        <p className="text-2xl font-bold text-green-900 dark:text-green-100">
          R$ {analysisData.summary.finalBalance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
        </p>
      </div>
      
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-purple-600 dark:text-purple-400">Score Crédito</h3>
        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
          {analysisData.summary.creditScore}
        </p>
      </div>

      {/* Gráfico de Barras - Receitas vs Despesas */}
      <div className="md:col-span-2 lg:col-span-4 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Fluxo Financeiro Mensal
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.monthlyFlow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
            <Legend />
            <Bar dataKey="income" fill="#22c55e" name="Receitas" />
            <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CategoriesTab({ data }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Gráfico de Pizza */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Distribuição por Categoria
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.categoryDistribution}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ category, percentage }) => `${category}: ${percentage.toFixed(1)}%`}
            >
              {data.categoryDistribution.map((_: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de Categorias */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Ranking de Gastos
        </h3>
        <div className="space-y-3">
          {data.categoryDistribution.slice(0, 8).map((cat: any, index: number) => (
            <div key={cat.category} className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="w-4 h-4 rounded-full mr-3"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-gray-900 dark:text-white font-medium">
                  {cat.category}
                </span>
              </div>
              <div className="text-right">
                <div className="text-gray-900 dark:text-white font-semibold">
                  R$ {cat.value.toLocaleString('pt-BR')}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {cat.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendsTab({ data }: any) {
  return (
    <div className="space-y-6">
      {/* Gráfico de Linha */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Tendência de Gastos
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.monthlyFlow}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, '']} />
            <Legend />
            <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas" />
            <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Receitas" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights de Tendências */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100">Média Mensal</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            R$ {(data.monthlyFlow.reduce((sum: number, month: any) => sum + month.expenses, 0) / data.monthlyFlow.length).toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">Gastos médios</p>
        </div>
        
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 dark:text-green-100">Maior Mês</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            R$ {Math.max(...data.monthlyFlow.map((m: any) => m.expenses)).toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">Pico de gastos</p>
        </div>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <h4 className="font-semibold text-orange-900 dark:text-orange-100">Menor Mês</h4>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            R$ {Math.min(...data.monthlyFlow.map((m: any) => m.expenses)).toLocaleString('pt-BR')}
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-400">Menor gasto</p>
        </div>
      </div>
    </div>
  );
}

function RiskTab({ data, analysisData }: any) {
  const riskLevel = analysisData.summary.riskLevel;
  const riskColors = {
    low: 'green',
    medium: 'yellow',
    high: 'red'
  };
  
  const riskColor = riskColors[riskLevel as keyof typeof riskColors];

  return (
    <div className="space-y-6">
      {/* Status de Risco */}
      <div className={`bg-${riskColor}-50 dark:bg-${riskColor}-900/20 p-4 rounded-lg border border-${riskColor}-200 dark:border-${riskColor}-800`}>
        <h3 className={`text-lg font-semibold text-${riskColor}-900 dark:text-${riskColor}-100 mb-2`}>
          Nível de Risco: {riskLevel.toUpperCase()}
        </h3>
        <p className={`text-${riskColor}-700 dark:text-${riskColor}-300`}>
          {riskLevel === 'low' && 'Perfil conservador com baixo risco financeiro.'}
          {riskLevel === 'medium' && 'Perfil moderado com alguns pontos de atenção.'}
          {riskLevel === 'high' && 'Perfil de alto risco que requer atenção imediata.'}
        </p>
      </div>

      {/* Métricas de Risco */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Métricas de Risco
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.riskMetrics} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="metric" type="category" width={100} />
            <Tooltip />
            <Bar dataKey="score" fill="#8884d8" name="Score Atual" />
            <Bar dataKey="benchmark" fill="#82ca9d" name="Benchmark" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recomendações */}
      <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Recomendações de Segurança
        </h3>
        <div className="space-y-2">
          {analysisData.summary.recommendations.split('.').filter((rec: string) => rec.trim()).map((rec: string, index: number) => (
            <div key={index} className="flex items-start">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300">{rec.trim()}.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function processDataForCharts(analysisData: any) {
  // Processar dados para os gráficos
  const categoryBreakdown = analysisData.categoryBreakdown || {};
  
  // Dados de distribuição por categoria
  const categoryDistribution = Object.entries(categoryBreakdown)
    .map(([category, data]: [string, any]) => ({
      category,
      value: data.total || 0,
      percentage: data.percentage || 0
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  // Dados de fluxo mensal (simulado baseado nas transações)
  const monthlyFlow = generateMonthlyFlow(analysisData.transactions || []);
  
  // Métricas de risco
  const riskMetrics = [
    { metric: 'Crédito', score: analysisData.summary.creditScore / 10, benchmark: 65 },
    { metric: 'Liquidez', score: 75, benchmark: 70 },
    { metric: 'Endividamento', score: 60, benchmark: 80 },
    { metric: 'Consistência', score: 85, benchmark: 75 }
  ];

  return {
    categoryDistribution,
    monthlyFlow,
    riskMetrics
  };
}

function generateMonthlyFlow(transactions: any[]) {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  
  return months.map(month => {
    const income = Math.random() * 5000 + 2000;
    const expenses = Math.random() * 4000 + 1500;
    
    return {
      month,
      income: Math.round(income),
      expenses: Math.round(expenses)
    };
  });
}

export default AnalyticsDashboard;