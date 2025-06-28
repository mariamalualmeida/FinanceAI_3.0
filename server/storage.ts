import { 
  users, conversations, messages, fileUploads, financialAnalyses, transactions, knowledgeBase, systemConfig,
  llmConfig, systemPrompts, multiLlmStrategy,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type FileUpload, type InsertFileUpload,
  type FinancialAnalysis, type InsertFinancialAnalysis,
  type Transaction, type InsertTransaction,
  type KnowledgeBase, type InsertKnowledgeBase,
  type SystemConfig, type InsertSystemConfig,
  type LlmConfig, type InsertLlmConfig,
  type SystemPrompts, type InsertSystemPrompts,
  type MultiLlmStrategy, type InsertMultiLlmStrategy
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;

  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  getConversationsByUser(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation, userId: number): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation>;
  deleteConversation(id: string): Promise<void>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<void>;

  // File upload operations
  getFileUpload(id: number): Promise<FileUpload | undefined>;
  getFileUploadsByUser(userId: number): Promise<FileUpload[]>;
  createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload>;
  updateFileUploadStatus(id: number, status: string): Promise<FileUpload>;

  // Financial analysis operations
  getFinancialAnalysis(id: number): Promise<FinancialAnalysis | undefined>;
  getAnalysesByUser(userId: number): Promise<FinancialAnalysis[]>;
  createFinancialAnalysis(analysis: InsertFinancialAnalysis): Promise<FinancialAnalysis>;
  updateFinancialAnalysis(id: number, updates: Partial<InsertFinancialAnalysis>): Promise<FinancialAnalysis>;

  // Transaction operations
  getTransaction(id: number): Promise<Transaction | undefined>;
  getTransactionsByAnalysis(analysisId: number): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  createMultipleTransactions(transactions: InsertTransaction[]): Promise<Transaction[]>;

  // Knowledge base operations
  getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined>;
  getAllKnowledgeBase(): Promise<KnowledgeBase[]>;
  createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase>;
  updateKnowledgeBase(id: number, updates: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase>;
  deleteKnowledgeBase(id: number): Promise<void>;
  searchKnowledgeBase(query: string): Promise<KnowledgeBase[]>;

  // System config operations
  getSystemConfig(key: string): Promise<SystemConfig | undefined>;
  getAllSystemConfig(): Promise<SystemConfig[]>;
  createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig>;
  updateSystemConfig(key: string, value: string, updatedBy: number): Promise<SystemConfig>;
  deleteSystemConfig(key: string): Promise<void>;

  // LLM config operations
  getLlmConfig(id: number): Promise<LlmConfig | undefined>;
  getAllLlmConfigs(): Promise<LlmConfig[]>;
  getEnabledLlmConfigs(): Promise<LlmConfig[]>;
  getPrimaryLlmConfig(): Promise<LlmConfig | undefined>;
  getBackupLlmConfigs(): Promise<LlmConfig[]>;
  createLlmConfig(config: InsertLlmConfig): Promise<LlmConfig>;
  updateLlmConfig(id: number, updates: Partial<InsertLlmConfig>): Promise<LlmConfig>;
  deleteLlmConfig(id: number): Promise<void>;

  // System prompts operations
  getSystemPrompts(id: number): Promise<SystemPrompts | undefined>;
  getAllSystemPrompts(): Promise<SystemPrompts[]>;
  getActiveSystemPrompts(): Promise<SystemPrompts[]>;
  getSystemPromptsByCategory(category: string): Promise<SystemPrompts[]>;
  createSystemPrompts(prompts: InsertSystemPrompts): Promise<SystemPrompts>;
  updateSystemPrompts(id: number, updates: Partial<InsertSystemPrompts>): Promise<SystemPrompts>;
  deleteSystemPrompts(id: number): Promise<void>;

  // Multi-LLM strategy operations
  getMultiLlmStrategy(id: number): Promise<MultiLlmStrategy | undefined>;
  getAllMultiLlmStrategies(): Promise<MultiLlmStrategy[]>;
  getActiveMultiLlmStrategy(): Promise<MultiLlmStrategy | undefined>;
  createMultiLlmStrategy(strategy: InsertMultiLlmStrategy): Promise<MultiLlmStrategy>;
  updateMultiLlmStrategy(id: number, updates: Partial<InsertMultiLlmStrategy>): Promise<MultiLlmStrategy>;
  setActiveStrategy(id: number): Promise<MultiLlmStrategy>;
  deleteMultiLlmStrategy(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Conversation operations
  async getConversation(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsByUser(userId: number): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async createConversation(conversation: InsertConversation, userId: number): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values({
      ...conversation,
      userId: userId
    }).returning();
    return newConversation;
  }

  async updateConversation(id: string, updates: Partial<InsertConversation>): Promise<Conversation> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }

  async deleteConversation(id: string): Promise<void> {
    // Delete related records first to avoid foreign key constraint violations
    await db.delete(fileUploads).where(eq(fileUploads.conversationId, id));
    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // File upload operations
  async getFileUpload(id: string): Promise<FileUpload | undefined> {
    const [fileUpload] = await db.select().from(fileUploads).where(eq(fileUploads.id, id));
    return fileUpload;
  }

  async getFileUploadsByUser(userId: number): Promise<FileUpload[]> {
    return await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.createdAt));
  }

  async createFileUpload(fileUpload: InsertFileUpload): Promise<FileUpload> {
    const [newFileUpload] = await db.insert(fileUploads).values(fileUpload).returning();
    return newFileUpload;
  }

  async updateFileUploadStatus(id: number, status: string): Promise<FileUpload> {
    const [updatedFileUpload] = await db
      .update(fileUploads)
      .set({ status })
      .where(eq(fileUploads.id, id))
      .returning();
    return updatedFileUpload;
  }

  // Financial analysis operations
  async getFinancialAnalysis(id: number): Promise<FinancialAnalysis | undefined> {
    const [analysis] = await db.select().from(financialAnalyses).where(eq(financialAnalyses.id, id));
    return analysis;
  }

  async getAnalysesByUser(userId: number): Promise<FinancialAnalysis[]> {
    return await db
      .select()
      .from(financialAnalyses)
      .where(eq(financialAnalyses.userId, userId))
      .orderBy(desc(financialAnalyses.createdAt));
  }

  async createFinancialAnalysis(analysis: InsertFinancialAnalysis): Promise<FinancialAnalysis> {
    const [newAnalysis] = await db.insert(financialAnalyses).values(analysis).returning();
    return newAnalysis;
  }

  async updateFinancialAnalysis(id: number, updates: Partial<InsertFinancialAnalysis>): Promise<FinancialAnalysis> {
    const [updatedAnalysis] = await db
      .update(financialAnalyses)
      .set(updates)
      .where(eq(financialAnalyses.id, id))
      .returning();
    return updatedAnalysis;
  }

  // Transaction operations
  async getTransaction(id: number): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async getTransactionsByAnalysis(analysisId: number): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.analysisId, analysisId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async createMultipleTransactions(transactionList: InsertTransaction[]): Promise<Transaction[]> {
    return await db.insert(transactions).values(transactionList).returning();
  }

  // Knowledge base operations
  async getKnowledgeBase(id: number): Promise<KnowledgeBase | undefined> {
    const [kb] = await db.select().from(knowledgeBase).where(eq(knowledgeBase.id, id));
    return kb;
  }

  async getAllKnowledgeBase(): Promise<KnowledgeBase[]> {
    return await db.select().from(knowledgeBase).where(eq(knowledgeBase.isActive, true));
  }

  async createKnowledgeBase(kb: InsertKnowledgeBase): Promise<KnowledgeBase> {
    const [newKb] = await db.insert(knowledgeBase).values(kb).returning();
    return newKb;
  }

  async updateKnowledgeBase(id: number, updates: Partial<InsertKnowledgeBase>): Promise<KnowledgeBase> {
    const [updatedKb] = await db
      .update(knowledgeBase)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(knowledgeBase.id, id))
      .returning();
    return updatedKb;
  }

  async deleteKnowledgeBase(id: number): Promise<void> {
    await db.update(knowledgeBase).set({ isActive: false }).where(eq(knowledgeBase.id, id));
  }

  async searchKnowledgeBase(query: string): Promise<KnowledgeBase[]> {
    return await db
      .select()
      .from(knowledgeBase)
      .where(
        and(
          eq(knowledgeBase.isActive, true),
          or(
            like(knowledgeBase.title, `%${query}%`),
            like(knowledgeBase.description, `%${query}%`),
            like(knowledgeBase.content, `%${query}%`)
          )
        )
      );
  }

  // System config operations
  async getSystemConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config;
  }

  async getAllSystemConfig(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig);
  }

  async createSystemConfig(config: InsertSystemConfig): Promise<SystemConfig> {
    const [newConfig] = await db.insert(systemConfig).values(config).returning();
    return newConfig;
  }

  async updateSystemConfig(key: string, value: string, updatedBy: number): Promise<SystemConfig> {
    const [updatedConfig] = await db
      .update(systemConfig)
      .set({ value, updatedBy, updatedAt: new Date() })
      .where(eq(systemConfig.key, key))
      .returning();
    return updatedConfig;
  }

  async deleteSystemConfig(key: string): Promise<void> {
    await db.delete(systemConfig).where(eq(systemConfig.key, key));
  }

  // LLM config operations
  async getLlmConfig(id: number): Promise<LlmConfig | undefined> {
    const [config] = await db.select().from(llmConfig).where(eq(llmConfig.id, id));
    return config;
  }

  async getAllLlmConfigs(): Promise<LlmConfig[]> {
    return await db.select().from(llmConfig).orderBy(llmConfig.priority);
  }

  async getEnabledLlmConfigs(): Promise<LlmConfig[]> {
    return await db.select().from(llmConfig).where(eq(llmConfig.isEnabled, true)).orderBy(llmConfig.priority);
  }

  async getPrimaryLlmConfig(): Promise<LlmConfig | undefined> {
    const [config] = await db.select().from(llmConfig).where(
      and(eq(llmConfig.isEnabled, true), eq(llmConfig.isPrimary, true))
    );
    return config;
  }

  async getBackupLlmConfigs(): Promise<LlmConfig[]> {
    return await db.select().from(llmConfig).where(
      and(eq(llmConfig.isEnabled, true), eq(llmConfig.isBackup, true))
    ).orderBy(llmConfig.priority);
  }

  async createLlmConfig(config: InsertLlmConfig): Promise<LlmConfig> {
    const [newConfig] = await db.insert(llmConfig).values(config).returning();
    return newConfig;
  }

  async updateLlmConfig(id: number, updates: Partial<InsertLlmConfig>): Promise<LlmConfig> {
    const [updatedConfig] = await db
      .update(llmConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(llmConfig.id, id))
      .returning();
    return updatedConfig;
  }

  async deleteLlmConfig(id: number): Promise<void> {
    await db.delete(llmConfig).where(eq(llmConfig.id, id));
  }

  // System prompts operations
  async getSystemPrompts(id: number): Promise<SystemPrompts | undefined> {
    const [prompts] = await db.select().from(systemPrompts).where(eq(systemPrompts.id, id));
    return prompts;
  }

  async getAllSystemPrompts(): Promise<SystemPrompts[]> {
    return await db.select().from(systemPrompts).orderBy(systemPrompts.category, systemPrompts.name);
  }

  async getActiveSystemPrompts(): Promise<SystemPrompts[]> {
    return await db.select().from(systemPrompts).where(eq(systemPrompts.isActive, true))
      .orderBy(systemPrompts.category, systemPrompts.name);
  }

  async getSystemPromptsByCategory(category: string): Promise<SystemPrompts[]> {
    return await db.select().from(systemPrompts).where(
      and(eq(systemPrompts.category, category), eq(systemPrompts.isActive, true))
    );
  }

  async createSystemPrompts(prompts: InsertSystemPrompts): Promise<SystemPrompts> {
    const [newPrompts] = await db.insert(systemPrompts).values(prompts).returning();
    return newPrompts;
  }

  async updateSystemPrompts(id: number, updates: Partial<InsertSystemPrompts>): Promise<SystemPrompts> {
    const [updatedPrompts] = await db
      .update(systemPrompts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemPrompts.id, id))
      .returning();
    return updatedPrompts;
  }

  async deleteSystemPrompts(id: number): Promise<void> {
    await db.delete(systemPrompts).where(eq(systemPrompts.id, id));
  }

  // Multi-LLM strategy operations
  async getMultiLlmStrategy(id: number): Promise<MultiLlmStrategy | undefined> {
    const [strategy] = await db.select().from(multiLlmStrategy).where(eq(multiLlmStrategy.id, id));
    return strategy;
  }

  async getAllMultiLlmStrategies(): Promise<MultiLlmStrategy[]> {
    return await db.select().from(multiLlmStrategy).orderBy(multiLlmStrategy.name);
  }

  async getActiveMultiLlmStrategy(): Promise<MultiLlmStrategy | undefined> {
    const [strategy] = await db.select().from(multiLlmStrategy).where(eq(multiLlmStrategy.isActive, true));
    return strategy;
  }

  async createMultiLlmStrategy(strategy: InsertMultiLlmStrategy): Promise<MultiLlmStrategy> {
    const [newStrategy] = await db.insert(multiLlmStrategy).values(strategy).returning();
    return newStrategy;
  }

  async updateMultiLlmStrategy(id: number, updates: Partial<InsertMultiLlmStrategy>): Promise<MultiLlmStrategy> {
    const [updatedStrategy] = await db
      .update(multiLlmStrategy)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(multiLlmStrategy.id, id))
      .returning();
    return updatedStrategy;
  }

  async setActiveStrategy(id: number): Promise<MultiLlmStrategy> {
    // Desativar todas as estratégias
    await db.update(multiLlmStrategy).set({ isActive: false });
    
    // Ativar a estratégia selecionada
    const [activeStrategy] = await db
      .update(multiLlmStrategy)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(multiLlmStrategy.id, id))
      .returning();
    return activeStrategy;
  }

  async deleteMultiLlmStrategy(id: number): Promise<void> {
    await db.delete(multiLlmStrategy).where(eq(multiLlmStrategy.id, id));
  }
}

export const storage = new DatabaseStorage();