export interface User {
  id: number;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: number;
  title?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  createdAt: string;
}

export interface FileUpload {
  id: string;
  userId: number;
  conversationId?: string;
  originalName: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  mimeType?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processingResult?: any;
  createdAt: string;
}

export interface FinancialAnalysis {
  id: string;
  userId: number;
  conversationId?: string;
  fileUploadId?: string;
  analysisType: string;
  results: FinancialAnalysisResult;
  score?: string;
  riskLevel?: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface FinancialAnalysisResult {
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  bettingDetection: {
    detected: boolean;
    transactionCount: number;
    totalAmount: number;
    details: string[];
  };
  riskIndicators: {
    inconsistentIncome: boolean;
    highExpenseRatio: boolean;
    negativeBalance: boolean;
    unusualTransactions: boolean;
    bettingActivity: boolean;
  };
  categoryBreakdown: Record<string, { count: number; amount: number }>;
  recommendations: string[];
  alerts: string[];
}

export interface UserSettings {
  id: number;
  userId: number;
  theme: 'light' | 'dark';
  primaryColor: string;
  llmProvider: 'openai' | 'anthropic' | 'gemini';
  llmApiKey?: string;
  anonymizationEnabled: boolean;
  twoFactorEnabled: boolean;
  settings?: any;
  createdAt: string;
  updatedAt: string;
}

export interface ChatContextValue {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  createConversation: (title?: string) => Promise<Conversation>;
  selectConversation: (id: string) => void;
  sendMessage: (content: string, context?: any) => Promise<void>;
  uploadFile: (file: File, conversationId: string) => Promise<FileUpload>;
}

export interface Theme {
  mode: 'light' | 'dark';
  primaryColor: string;
}

export interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Partial<Theme>) => void;
  toggleMode: () => void;
}
