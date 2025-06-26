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
  // Authentication routes
  app.post('/api/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      if (userData.email) {
        const existingEmail = await storage.getUserByEmail(userData.email);
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already exists' });
        }
      }

      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      
      req.session.userId = user.id;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ message: 'Invalid registration data' });
    }
  });

  app.post('/api/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const { password: _, ...userWithoutPassword } = user;
      req.session.userId = user.id;
      res.json({ user: userWithoutPassword });
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
      const conversations = await storage.getConversationsByUser(req.session.userId!);
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

  // Message routes
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      // Create user message
      const userMessage = await storage.createMessage({
        conversationId,
        sender: 'user',
        content,
      });

      // Generate AI response
      const aiResponse = `Recebi sua mensagem: "${content}"\n\nComo assistente especializado em análise financeira, posso ajudar com:\n\n• Análise de extratos bancários\n• Avaliação de score de crédito\n• Detecção de padrões suspeitos\n• Consultoria em investimentos\n• Análise de riscos\n\nPara uma análise detalhada, envie seus documentos financeiros.`;

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

  // File upload and analysis
  app.post('/api/upload', isAuthenticated, upload.single('files'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No file uploaded' 
        });
      }

      const conversationId = req.body.conversationId ? parseInt(req.body.conversationId) : null;

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

  const httpServer = createServer(app);
  return httpServer;
}