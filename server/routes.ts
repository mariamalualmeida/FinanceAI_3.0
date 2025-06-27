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

// Authentication middleware
const isAuthenticated = (req: any, res: Response, next: NextFunction) => {
  if (req.session?.userId) {
    next();
  } else {
    res.status(401).json({ message: 'Not authenticated' });
  }
};

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common financial document formats
    const allowedTypes = /\.(pdf|xlsx?|csv|txt|png|jpe?g)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Please upload PDF, Excel, CSV, TXT, or image files.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Fixed users system
  const FIXED_USERS = [
    {
      id: 1,
      username: 'Admin',
      password: 'admin123',
      email: 'admin@financeai.com',
      role: 'admin',
      fullName: 'Usuário Padrão'
    },
    {
      id: 2,
      username: 'Leonardo',
      password: 'L30n4rd0@1004',
      email: 'leonardo@financeai.com',
      role: 'admin',
      fullName: 'Administrador'
    }
  ];

  // Initialize fixed users if they don't exist
  async function initializeUsers() {
    for (const fixedUser of FIXED_USERS) {
      const existingUser = await storage.getUserByUsername(fixedUser.username);
      if (!existingUser) {
        await storage.createUser({
          username: fixedUser.username,
          password: fixedUser.password,
          email: fixedUser.email,
          role: fixedUser.role
        });
      }
    }
  }
  
  // Initialize users on server start
  initializeUsers().catch(console.error);

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      // Check against fixed users
      const fixedUser = FIXED_USERS.find(u => u.username === username && u.password === password);
      if (!fixedUser) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create session
      req.session.userId = fixedUser.id;
      
      const userResponse = {
        id: fixedUser.id,
        username: fixedUser.username,
        email: fixedUser.email,
        role: fixedUser.role,
        fullName: fixedUser.fullName
      };
      
      res.json({ user: userResponse });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.get('/api/user', isAuthenticated, async (req: any, res) => {
    try {
      // First check if user exists in fixed users
      const fixedUser = FIXED_USERS.find(u => u.id === req.session.userId);
      if (fixedUser) {
        const { password, ...userWithoutPassword } = fixedUser;
        return res.json(userWithoutPassword);
      }

      // Fallback to database lookup
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
            conversationId || 1,
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