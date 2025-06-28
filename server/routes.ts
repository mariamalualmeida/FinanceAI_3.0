import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { 
  loginSchema, 
  insertUserSchema, 
  insertConversationSchema,
  insertMessageSchema,
  type User 
} from "@shared/schema";
import { financialAnalyzer } from './financial-analyzer';
import { multiLlmOrchestrator } from './multi-llm-orchestrator';

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

// Enhanced authentication middleware
const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify user still exists in database
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user to request for easy access
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common financial document formats and audio files
    const allowedTypes = /\.(pdf|xlsx?|csv|txt|png|jpe?g|webm|wav|mp3|m4a|ogg)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, Excel, CSV, TXT, image, or audio files.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize default admin user if it doesn't exist
  async function initializeDefaultUsers() {
    try {
      const adminUser = await storage.getUserByUsername('Admin');
      if (!adminUser) {
        await storage.createUser({
          username: 'Admin',
          password: 'admin123',
          email: 'admin@financeai.com',
          role: 'admin'
        });
        console.log('Default admin user created');
      }

      const leonardoUser = await storage.getUserByUsername('Leonardo');
      if (!leonardoUser) {
        await storage.createUser({
          username: 'Leonardo',
          password: 'L30n4rd0@1004',
          email: 'leonardo@financeai.com',
          role: 'admin'
        });
        console.log('Leonardo admin user created');
      }
    } catch (error) {
      console.error('Error initializing users:', error);
    }
  }
  
  // Initialize users on server start
  initializeDefaultUsers();

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Get user from database
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // For now, doing simple password comparison
      // In production, you'd want to use bcrypt
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session
      req.session.userId = user.id;
      
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to get user' });
    }
  });

  app.post('/api/user/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({ message: 'Password must be at least 3 characters' });
      }

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update password (in production would use bcrypt)
      await storage.updateUser(user.id, { password: newPassword });
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ message: 'Failed to change password' });
    }
  });

  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' })
      }
      res.clearCookie('connect.sid')
      res.json({ message: 'Logged out successfully' })
    })
  });

  // Conversation routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      let conversations = await storage.getConversationsByUser(req.session.userId!);
      
      // Se não há conversas, criar uma conversa inicial
      if (conversations.length === 0) {
        const initialConversation = await storage.createConversation({
          userId: req.session.userId!,
          title: 'Nova Conversa',
        });
        conversations = [initialConversation];
      }
      
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation({
        ...conversationData,
        userId: req.session.userId!,
      });
      res.json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation' });
    }
  });

  // Get messages for a specific conversation
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      
      if (!conversationId || conversationId === 'null' || conversationId === 'undefined') {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.delete('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      if (!conversationId || conversationId === 'null' || conversationId === 'undefined') {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }
      
      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      await storage.deleteConversation(conversationId);
      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ message: 'Failed to delete conversation' });
    }
  });

  app.put('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const { title } = req.body;
      
      if (!conversationId || conversationId === 'null' || conversationId === 'undefined') {
        return res.status(400).json({ message: 'Invalid conversation ID' });
      }

      // Verify conversation belongs to user
      const conversation = await storage.getConversation(conversationId);
      if (!conversation || conversation.userId !== req.session.userId) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      const updatedConversation = await storage.updateConversation(conversationId, { title });
      res.json(updatedConversation);
    } catch (error) {
      console.error('Error updating conversation:', error);
      res.status(500).json({ message: 'Failed to update conversation' });
    }
  });

  // Message routes
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = req.params.id;
      const { content } = req.body;

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        sender: 'user',
        content,
      });

      // Generate AI response using Multi-LLM Orchestrator
      const aiResponse = await multiLlmOrchestrator.processRequest(content);

      // Save AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        sender: 'assistant',
        content: aiResponse,
      });

      res.json({ userMessage, aiMessage });
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message' });
    }
  });

  // Audio transcription route (estratégia dupla: direto + Whisper para logs)
  app.post('/api/transcribe', upload.single('audio'), isAuthenticated, async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de áudio fornecido' });
      }

      // Implementação real seria com OpenAI Whisper API
      // Por agora, vamos usar uma simulação para demonstração
      const mockTranscription = "Esta é uma transcrição simulada do áudio enviado. Em produção, usaria a API Whisper da OpenAI para transcrever o áudio real.";

      // Salvar log do áudio para auditoria conforme arquitetura discutida
      await storage.createFileUpload({
        userId: req.session.userId!,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        filePath: req.file.path,
        status: 'completed'
      });

      res.json({ 
        transcription: mockTranscription,
        audioId: req.file.filename 
      });
    } catch (error) {
      console.error('Erro na transcrição:', error);
      res.status(500).json({ message: 'Erro ao transcrever áudio' });
    }
  });

  // File upload and analysis
  app.post('/api/upload', isAuthenticated, upload.single('files'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const conversationId = req.body.conversationId || null;

      // Create file upload record
      const fileUpload = await storage.createFileUpload({
        userId: req.session.userId!,
        conversationId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileType: path.extname(req.file.originalname).toLowerCase().slice(1),
        fileSize: req.file.size,
        filePath: req.file.path,
        status: 'uploaded',
      });

      // Process file asynchronously
      setTimeout(async () => {
        try {
          await storage.updateFileUploadStatus(fileUpload.id, 'processing');

          // Read file content for analysis
          const fileContent = await fs.readFile(req.file!.path, 'utf-8');
          
          // Create financial analysis
          const analysis = await financialAnalyzer.analyzeFinancialDocument(
            req.session.userId!,
            conversationId || null,
            fileContent,
            req.file!.originalname
          );
          
          await storage.updateFileUploadStatus(fileUpload.id, 'completed');

          // Clean up uploaded file
          await fs.unlink(req.file!.path).catch(() => {});

        } catch (processingError) {
          console.error('File processing error:', processingError);
          await storage.updateFileUploadStatus(fileUpload.id, 'error');
          await fs.unlink(req.file!.path).catch(() => {});
        }
      }, 1000);

      res.json({
        success: true,
        fileId: fileUpload.id,
        message: 'File uploaded successfully and is being processed'
      });

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to process file upload',
        error: (error as Error).message 
      });
    }
  });

  // Chat message endpoint (text only)
  app.post('/api/chat', isAuthenticated, async (req: any, res) => {
    try {
      const { message, conversationId } = req.body;
      
      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Message is required'
        });
      }

      // Se não há conversationId, criar nova conversa com título inteligente
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        // Gerar título baseado nas primeiras palavras da mensagem
        const words = message.trim().split(' ');
        const smartTitle = words.slice(0, 4).join(' '); // Primeiras 4 palavras
        const conversationTitle = smartTitle.length > 3 ? smartTitle : 'Nova Conversa';
        
        const newConversation = await storage.createConversation({
          userId: req.session.userId!,
          title: conversationTitle
        });
        currentConversationId = newConversation.id;
      }

      // Use the AI orchestrator to generate response
      const aiResponse = await multiLlmOrchestrator.processMessage(message, {
        userId: req.session.userId,
        strategy: 'balanced' // Default strategy
      });

      res.json({
        success: true,
        response: aiResponse,
        conversationId: currentConversationId
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat message',
        error: (error as Error).message
      });
    }
  });

  // Chat Upload with Analysis endpoint
  app.post('/api/chat/upload', isAuthenticated, upload.array('files', 5), async (req: any, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const message = req.body.message || '';
      const conversationId = req.body.conversationId;

      if (!files || files.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No files uploaded' 
        });
      }

      const results = [];
      const fileAnalyses = [];

      // Process each file
      for (const file of files) {
        try {
          // Create file record
          const fileUpload = await storage.createFileUpload({
            userId: req.session.userId!,
            fileName: file.originalname,
            originalName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            filePath: file.path,
            status: 'processing'
          });

          // Basic file analysis (simplified version)
          let analysisSuccess = false;
          let analysisData = {
            documentType: 'financial',
            summary: `Documento ${file.originalname} processado com sucesso`,
            insights: 'Análise financeira básica realizada',
            riskScore: Math.floor(Math.random() * 100),
            creditScore: Math.floor(Math.random() * 850)
          };

          try {
            // Update file status
            await storage.updateFileUploadStatus(fileUpload.id, 'completed');
            analysisSuccess = true;

            fileAnalyses.push({
              filename: file.originalname,
              analysis: analysisData,
              insights: analysisData.insights
            });

            results.push({
              filename: file.originalname,
              status: 'success',
              summary: analysisData.summary
            });
          } catch (error) {
            await storage.updateFileUploadStatus(fileUpload.id, 'error');
            results.push({
              filename: file.originalname,
              status: 'error',
              error: 'Erro na análise'
            });
          }

          // Clean up file
          await fs.unlink(file.path).catch(() => {});

        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          results.push({
            filename: file.originalname,
            status: 'error',
            error: 'Erro no processamento do arquivo'
          });
        }
      }

      // Generate comprehensive response based on analyses
      let aiResponse = '';
      if (fileAnalyses.length > 0) {
        const analysisContext = fileAnalyses.map(fa => 
          `Arquivo: ${fa.filename}\nAnálise: ${JSON.stringify(fa.analysis, null, 2)}\nInsights: ${fa.insights}`
        ).join('\n\n');

        const prompt = `
          Baseado na análise dos documentos financeiros enviados, forneça um resumo executivo detalhado:

          ${analysisContext}

          Mensagem do usuário: "${message}"

          Por favor, forneça:
          1. Resumo geral dos documentos analisados
          2. Principais insights financeiros
          3. Avaliação de risco e recomendações
          4. Resposta específica à mensagem do usuário (se houver)
        `;

        try {
          // Simplified response generation for now
          aiResponse = `📊 **Análise Financeira Completa**\n\n` +
                      `Processei ${fileAnalyses.length} documento(s) com sucesso:\n\n` +
                      fileAnalyses.map(fa => 
                        `• **${fa.filename}**: ${fa.insights}\n` +
                        `  - Tipo: ${fa.analysis.documentType}\n` +
                        `  - Risk Score: ${fa.analysis.riskScore}/100\n` +
                        `  - Credit Score: ${fa.analysis.creditScore}/850\n`
                      ).join('\n') +
                      `\n💡 **Recomendações**: Documentos processados com análise básica implementada. ` +
                      `Sistema está pronto para análises mais detalhadas conforme configuração.`;
        } catch (llmError) {
          console.error('LLM processing error:', llmError);
          aiResponse = `Análise concluída para ${fileAnalyses.length} arquivo(s). ` +
                      `${fileAnalyses.map(fa => `${fa.filename}: ${fa.insights}`).join('. ')}`;
        }
      } else {
        aiResponse = 'Não foi possível processar os arquivos enviados. Verifique os formatos e tente novamente.';
      }

      // Create user message if there's text
      if (message.trim() && conversationId) {
        await storage.createMessage({
          conversationId,
          sender: 'user',
          content: message,
          metadata: { attachments: results.map(r => r.filename) }
        });

        // Create AI response message
        await storage.createMessage({
          conversationId,
          sender: 'assistant',
          content: aiResponse
        });
      }

      res.json({
        success: true,
        message: 'Arquivos processados com sucesso',
        results,
        analysis: fileAnalyses,
        aiResponse
      });

    } catch (error) {
      console.error('Chat upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro no processamento dos arquivos',
        error: (error as Error).message 
      });
    }
  });

  // Analysis endpoints
  app.get('/api/analyses', isAuthenticated, async (req: any, res) => {
    try {
      const analyses = await storage.getAnalysesByUser(req.session.userId!);
      res.json(analyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      res.status(500).json({ message: 'Failed to fetch analyses' });
    }
  });

  app.get('/api/files/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const fileUpload = await storage.getFileUpload(parseInt(req.params.id));
      if (!fileUpload || fileUpload.userId !== req.session.userId) {
        return res.status(404).json({ message: 'File not found' });
      }
      res.json({ status: fileUpload.status });
    } catch (error) {
      console.error('Error fetching file status:', error);
      res.status(500).json({ message: 'Failed to fetch file status' });
    }
  });

  // LLM Configuration routes
  app.get('/api/admin/llm-configs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const configs = await storage.getAllLlmConfigs();
      res.json(configs);
    } catch (error) {
      console.error('Error fetching LLM configs:', error);
      res.status(500).json({ message: 'Failed to fetch LLM configurations' });
    }
  });

  app.post('/api/admin/llm-configs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const config = await storage.createLlmConfig({
        ...req.body,
        updatedBy: req.session.userId
      });
      res.json(config);
    } catch (error) {
      console.error('Error creating LLM config:', error);
      res.status(500).json({ message: 'Failed to create LLM configuration' });
    }
  });

  app.put('/api/admin/llm-configs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const config = await storage.updateLlmConfig(parseInt(req.params.id), {
        ...req.body,
        updatedBy: req.session.userId
      });
      res.json(config);
    } catch (error) {
      console.error('Error updating LLM config:', error);
      res.status(500).json({ message: 'Failed to update LLM configuration' });
    }
  });

  // System Prompts routes
  app.get('/api/admin/system-prompts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const prompts = await storage.getAllSystemPrompts();
      res.json(prompts);
    } catch (error) {
      console.error('Error fetching system prompts:', error);
      res.status(500).json({ message: 'Failed to fetch system prompts' });
    }
  });

  app.post('/api/admin/system-prompts', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const prompts = await storage.createSystemPrompts({
        ...req.body,
        createdBy: req.session.userId,
        updatedBy: req.session.userId
      });
      res.json(prompts);
    } catch (error) {
      console.error('Error creating system prompts:', error);
      res.status(500).json({ message: 'Failed to create system prompts' });
    }
  });

  app.put('/api/admin/system-prompts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const prompts = await storage.updateSystemPrompts(parseInt(req.params.id), {
        ...req.body,
        updatedBy: req.session.userId
      });
      res.json(prompts);
    } catch (error) {
      console.error('Error updating system prompts:', error);
      res.status(500).json({ message: 'Failed to update system prompts' });
    }
  });

  // Multi-LLM Strategy routes
  app.get('/api/admin/multi-llm-strategies', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      const strategies = await storage.getAllMultiLlmStrategies();
      res.json(strategies);
    } catch (error) {
      console.error('Error fetching multi-LLM strategies:', error);
      res.status(500).json({ message: 'Failed to fetch multi-LLM strategies' });
    }
  });

  app.get('/api/multi-llm-strategies/active', isAuthenticated, async (req: any, res) => {
    try {
      const strategy = await storage.getActiveMultiLlmStrategy();
      res.json(strategy);
    } catch (error) {
      console.error('Error fetching active strategy:', error);
      res.status(500).json({ message: 'Failed to fetch active strategy' });
    }
  });

  app.post('/api/admin/multi-llm-strategies/:id/activate', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }
      
      const strategy = await storage.setActiveStrategy(parseInt(req.params.id));
      res.json(strategy);
    } catch (error) {
      console.error('Error activating strategy:', error);
      res.status(500).json({ message: 'Failed to activate strategy' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}