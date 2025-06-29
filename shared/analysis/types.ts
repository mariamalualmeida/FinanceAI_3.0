export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  category: string;
  bank?: string;
  balance?: number;
  confidence?: number;
}

export interface BankDetectionResult {
  bank: string;
  bankName: string;
  confidence: number;
  method: string;
}

export interface BankParser {
  detectBank(content: string): BankDetectionResult;
  parseTransactions(content: string, bankCode: string): Transaction[];
}

export interface FinancialAnalysis {
  transactions: Transaction[];
  summary: {
    totalCredits: number;
    totalDebits: number;
    finalBalance: number;
    transactionCount: number;
    creditScore: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string;
    accuracy: number;
  };
  categoryBreakdown: Record<string, {
    total: number;
    count: number;
    percentage: number;
  }>;
  riskFactors: string[];
  trends: {
    monthlySpending: number[];
    categories: Record<string, number>;
  };
}

export interface DocumentProcessingResult {
  success: boolean;
  bankDetected: BankDetectionResult;
  analysis: FinancialAnalysis;
  processingTime: number;
  method: 'enhanced_parser' | 'llm_validation' | 'cross_validation';
  confidence: number;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface ParallelProcessingJob {
  id: string;
  fileName: string;
  userId: number;
  conversationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: DocumentProcessingResult;
  error?: string;
}

export interface CategoryRule {
  name: string;
  keywords: string[];
  priority: number;
  subcategories?: string[];
}

export interface FraudPattern {
  name: string;
  description: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: string;
}

export interface CreditScoreFactors {
  income: number;
  expenses: number;
  consistency: number;
  riskTransactions: number;
  accountAge: number;
  overdrafts: number;
}

export interface ReportData {
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