import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcrypt";
import session from "express-session";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { storage } from "./storage";
import { fileProcessor } from "./services/fileProcessor";
import { llmService } from "./services/llmService";
import { financialAnalyzer } from "./services/financialAnalyzer";
import { 
  loginSchema, 
  insertUserSchema, 
  insertConversationSchema,
  insertMessageSchema,
  insertUserSettingsSchema,
  type User 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'image/jpeg',
      'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado'), false);
    }
  }
});

// Session configuration
const sessionConfig = session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
});

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  app.use(sessionConfig);

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      req.session.userId = user.id;
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    try {
      const user = await storage.getUserById(req.session.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // Conversation routes
  app.get('/api/conversations', requireAuth, async (req: any, res) => {
    try {
      const conversations = await storage.getConversationsByUserId(req.session.userId);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch conversations' });
    }
  });

  app.post('/api/conversations', requireAuth, async (req: any, res) => {
    try {
      const conversationData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation({
        ...conversationData,
        userId: req.session.userId,
      });
      res.json(conversation);
    } catch (error) {
      res.status(400).json({ message: 'Invalid request data' });
    }
  });

  app.get('/api/conversations/:id/messages', requireAuth, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByConversationId(req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Chat routes
  app.post('/api/chat/message', requireAuth, async (req: any, res) => {
    try {
      const { conversationId, content, context } = req.body;
      
      // Save user message
      await storage.createMessage({
        conversationId,
        role: 'user',
        content,
      });

      // Get user settings to determine LLM provider
      const userSettings = await storage.getUserSettings(req.session.userId);
      const providerName = userSettings?.llmProvider || 'openai';
      const userApiKey = userSettings?.llmApiKey;

      // Generate AI response
      const aiResponse = await llmService.generateChatResponse(
        content,
        providerName,
        context,
        userApiKey
      );

      // Save AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        role: 'assistant',
        content: aiResponse,
      });

      res.json({ message: aiMessage });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ message: 'Failed to process message' });
    }
  });

  // File upload and processing routes
  app.post('/api/files/upload', requireAuth, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { conversationId } = req.body;

      // Create file upload record
      const fileUpload = await storage.createFileUpload({
        userId: req.session.userId,
        conversationId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
        fileType: path.extname(req.file.originalname).toLowerCase().slice(1),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        status: 'pending',
      });

      res.json({ fileUpload });

      // Process file asynchronously
      try {
        await storage.updateFileUpload(fileUpload.id, { status: 'processing' });

        const document = await fileProcessor.processDocument(
          req.file.path,
          fileUpload.fileType
        );

        await storage.updateFileUpload(fileUpload.id, {
          status: 'completed',
          processingResult: document,
        });

        // Clean up uploaded file
        await fs.unlink(req.file.path).catch(() => {});

        // Create financial analysis
        const analysis = financialAnalyzer.analyzeFinancialDocument(document);
        
        await storage.createFinancialAnalysis({
          userId: req.session.userId,
          conversationId,
          fileUploadId: fileUpload.id,
          analysisType: 'comprehensive',
          results: analysis,
          score: analysis.creditScore.toString(),
          riskLevel: analysis.riskLevel,
        });

      } catch (processingError) {
        console.error('File processing error:', processingError);
        await storage.updateFileUpload(fileUpload.id, {
          status: 'error',
          processingResult: { error: processingError.message },
        });
        await fs.unlink(req.file.path).catch(() => {});
      }

    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload file' });
    }
  });

  app.get('/api/files/:id/status', requireAuth, async (req: any, res) => {
    try {
      const fileUpload = await storage.getFileUploadById(req.params.id);
      if (!fileUpload) {
        return res.status(404).json({ message: 'File not found' });
      }
      res.json(fileUpload);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch file status' });
    }
  });

  // Financial analysis routes
  app.get('/api/analysis/:fileId', requireAuth, async (req: any, res) => {
    try {
      const analysis = await storage.getFinancialAnalysisByFileUploadId(req.params.fileId);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }
      res.json(analysis);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch analysis' });
    }
  });

  app.get('/api/analysis', requireAuth, async (req: any, res) => {
    try {
      const analyses = await storage.getFinancialAnalysesByUserId(req.session.userId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch analyses' });
    }
  });

  app.post('/api/analysis/generate-report', requireAuth, async (req: any, res) => {
    try {
      const { analysisId } = req.body;
      
      const analysis = await storage.getFinancialAnalysisByFileUploadId(analysisId);
      if (!analysis) {
        return res.status(404).json({ message: 'Analysis not found' });
      }

      const userSettings = await storage.getUserSettings(req.session.userId);
      const providerName = userSettings?.llmProvider || 'openai';
      const userApiKey = userSettings?.llmApiKey;

      const report = await llmService.generateFinancialReport(
        analysis.results,
        providerName,
        userApiKey
      );

      res.json({ report });
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  });

  // User settings routes
  app.get('/api/settings', requireAuth, async (req: any, res) => {
    try {
      const settings = await storage.getUserSettings(req.session.userId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', requireAuth, async (req: any, res) => {
    try {
      const settingsData = insertUserSettingsSchema.parse(req.body);
      const settings = await storage.updateUserSettings(req.session.userId, settingsData);
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: 'Invalid settings data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
