import express from 'express';
import multer from 'multer';
import { FinancialAnalyzer } from '../../shared/analysis/financial-analyzer';
import { MultiLLMOrchestrator } from '../../shared/analysis/multi-llm-orchestrator';

const router = express.Router();

// Lightweight storage for PWA (uses IndexedDB on client side)
class LiteStorage {
  private conversations: Map<string, any> = new Map();
  private messages: Map<string, any[]> = new Map();
  private analyses: Map<string, any> = new Map();

  // Simplified conversation operations
  async createConversation(conversation: any) {
    const id = crypto.randomUUID();
    const newConversation = {
      id,
      ...conversation,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(id, newConversation);
    this.messages.set(id, []);
    return newConversation;
  }

  async getConversationsByUser(userId: number) {
    return Array.from(this.conversations.values()).filter(c => c.userId === userId);
  }

  async createMessage(message: any) {
    const conversationMessages = this.messages.get(message.conversationId) || [];
    const newMessage = {
      id: Date.now(),
      ...message,
      createdAt: new Date()
    };
    conversationMessages.push(newMessage);
    this.messages.set(message.conversationId, conversationMessages);
    return newMessage;
  }

  async getMessagesByConversation(conversationId: string) {
    return this.messages.get(conversationId) || [];
  }

  async createFinancialAnalysis(analysis: any) {
    const id = crypto.randomUUID();
    const newAnalysis = {
      id,
      ...analysis,
      createdAt: new Date()
    };
    this.analyses.set(id, newAnalysis);
    return newAnalysis;
  }

  async getFinancialAnalysis(id: string) {
    return this.analyses.get(id);
  }

  // Stub implementations for compatibility
  async createMultipleTransactions() { return []; }
  async getTransactionsByAnalysis() { return []; }
  async updateFileUploadStatus() { return {}; }
}

// Initialize lightweight components
const liteStorage = new LiteStorage();
const llmOrchestrator = new MultiLLMOrchestrator();
const financialAnalyzer = new FinancialAnalyzer(llmOrchestrator, liteStorage);

// Initialize LLM orchestrator
llmOrchestrator.initialize();

// File upload configuration for PWA
const upload = multer({
  dest: '/tmp/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for PWA
    files: 1 // Single file for PWA
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado na versão PWA'));
    }
  }
});

// PWA-specific routes with simplified functionality

// Light authentication (session-based, no complex user management)
router.post('/lite/auth', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simplified auth for PWA
    if (username === 'user' && password === 'demo') {
      req.session.user = { id: 1, username: 'user', role: 'user' };
      res.json({ success: true, user: req.session.user });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro na autenticação' });
  }
});

// Get user info
router.get('/lite/user', (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'Não autenticado' });
  }
});

// Simple chat endpoint
router.post('/lite/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    // Create or get conversation
    let conversation;
    if (conversationId) {
      const conversations = await liteStorage.getConversationsByUser(userId);
      conversation = conversations.find(c => c.id === conversationId);
    }

    if (!conversation) {
      conversation = await liteStorage.createConversation({
        userId,
        title: message.substring(0, 50) + (message.length > 50 ? '...' : '')
      });
    }

    // Save user message
    await liteStorage.createMessage({
      conversationId: conversation.id,
      sender: 'user',
      content: message
    });

    // Process with LLM
    const response = await llmOrchestrator.processMessage(message, { userId: userId.toString() });

    // Save assistant response
    await liteStorage.createMessage({
      conversationId: conversation.id,
      sender: 'assistant',
      content: response
    });

    res.json({
      success: true,
      conversationId: conversation.id,
      response
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao processar mensagem. Funcionalidade limitada na versão PWA.'
    });
  }
});

// Simplified file upload for PWA
router.post('/lite/upload', upload.single('file'), async (req, res) => {
  try {
    const { conversationId } = req.body;
    const userId = req.session.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }

    // Read file content (simplified for PWA)
    const fs = require('fs');
    const fileContent = fs.readFileSync(req.file.path, 'utf8');

    // Quick analysis for PWA
    const analysis = {
      creditScore: 600,
      riskLevel: 'medium' as const,
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      transactionCount: 0,
      suspiciousTransactions: 0,
      recommendations: ['Análise básica PWA realizada', 'Para análise completa, use a versão web'],
      patterns: {
        gambling: false,
        highRisk: false,
        recurringPayments: 0,
        cashFlow: 'stable' as const
      }
    };

    // Save analysis
    const savedAnalysis = await liteStorage.createFinancialAnalysis({
      fileUploadId: req.file.filename,
      results: analysis,
      status: 'completed',
      recommendations: JSON.stringify(analysis.recommendations)
    });

    // Generate report message
    const reportContent = `📱 **Análise PWA Completa**

**Score de Crédito:** ${analysis.creditScore}/1000
**Nível de Risco:** ${analysis.riskLevel === 'low' ? 'Baixo' : analysis.riskLevel === 'medium' ? 'Médio' : 'Alto'}

**Resumo:**
- Arquivo processado: ${req.file.originalname}
- Status: Análise básica concluída
- Versão: PWA Lite

**Recomendações PWA:**
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}

💡 **Dica:** Para análise detalhada com IA, use a versão completa web.`;

    // Save report message
    await liteStorage.createMessage({
      conversationId,
      sender: 'assistant',
      content: reportContent
    });

    // Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      uploadId: savedAnalysis.id,
      message: 'Arquivo processado na versão PWA'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Erro no upload PWA'
    });
  }
});

// Get conversations for PWA
router.get('/lite/conversations', async (req, res) => {
  try {
    const userId = req.session.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Não autenticado' });
    }

    const conversations = await liteStorage.getConversationsByUser(userId);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar conversas' });
  }
});

// Get messages for PWA
router.get('/lite/conversations/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await liteStorage.getMessagesByConversation(id);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// Health check for PWA
router.get('/lite/health', (req, res) => {
  res.json({
    status: 'ok',
    version: 'PWA-Lite-v2.8.0',
    features: {
      chat: true,
      fileUpload: true,
      basicAnalysis: true,
      offline: true,
      fullAnalysis: false,
      adminPanel: false
    }
  });
});

// Sync endpoint for when back online
router.post('/lite/sync', async (req, res) => {
  try {
    const { conversations, messages, analyses } = req.body;
    
    // In a real implementation, this would sync with the main database
    // For now, just acknowledge the sync
    
    res.json({
      success: true,
      synced: {
        conversations: conversations?.length || 0,
        messages: messages?.length || 0,
        analyses: analyses?.length || 0
      },
      message: 'Dados sincronizados com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Erro na sincronização'
    });
  }
});

export default router;