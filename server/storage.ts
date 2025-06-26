import { 
  users, conversations, messages, fileUploads, financialAnalyses, transactions, knowledgeBase, systemConfig,
  type User, type InsertUser,
  type Conversation, type InsertConversation,
  type Message, type InsertMessage,
  type FileUpload, type InsertFileUpload,
  type FinancialAnalysis, type InsertFinancialAnalysis,
  type Transaction, type InsertTransaction,
  type KnowledgeBase, type InsertKnowledgeBase,
  type SystemConfig, type InsertSystemConfig
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
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByUser(userId: number): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;

  // Message operations
  getMessage(id: number): Promise<Message | undefined>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
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
  async getConversation(id: number): Promise<Conversation | undefined> {
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

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async updateConversation(id: number, updates: Partial<InsertConversation>): Promise<Conversation> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation;
  }

  async deleteConversation(id: number): Promise<void> {
    await db.delete(conversations).where(eq(conversations.id, id));
  }

  // Message operations
  async getMessage(id: number): Promise<Message | undefined> {
    const [message] = await db.select().from(messages).where(eq(messages.id, id));
    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
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
  async getFileUpload(id: number): Promise<FileUpload | undefined> {
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
}

export const storage = new DatabaseStorage();