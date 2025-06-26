import {
  users,
  conversations,
  messages,
  fileUploads,
  financialAnalyses,
  userSettings,
  type User,
  type InsertUser,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type FileUpload,
  type InsertFileUpload,
  type FinancialAnalysis,
  type InsertFinancialAnalysis,
  type UserSettings,
  type InsertUserSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation operations
  getConversationsByUserId(userId: number): Promise<Conversation[]>;
  getConversationById(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation & { userId: number }): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  
  // Message operations
  getMessagesByConversationId(conversationId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // File upload operations
  createFileUpload(fileUpload: InsertFileUpload & { userId: number }): Promise<FileUpload>;
  getFileUploadById(id: string): Promise<FileUpload | undefined>;
  updateFileUpload(id: string, updates: Partial<FileUpload>): Promise<FileUpload | undefined>;
  getFileUploadsByUserId(userId: number): Promise<FileUpload[]>;
  
  // Financial analysis operations
  createFinancialAnalysis(analysis: InsertFinancialAnalysis & { userId: number }): Promise<FinancialAnalysis>;
  getFinancialAnalysesByUserId(userId: number): Promise<FinancialAnalysis[]>;
  getFinancialAnalysisByFileUploadId(fileUploadId: string): Promise<FinancialAnalysis | undefined>;
  
  // User settings operations
  getUserSettings(userId: number): Promise<UserSettings | undefined>;
  updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Conversation operations
  async getConversationsByUserId(userId: number): Promise<Conversation[]> {
    return db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));
  }

  async getConversationById(id: string): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation & { userId: number }): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return newConversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation || undefined;
  }

  // Message operations
  async getMessagesByConversationId(conversationId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  // File upload operations
  async createFileUpload(fileUpload: InsertFileUpload & { userId: number }): Promise<FileUpload> {
    const [newFileUpload] = await db
      .insert(fileUploads)
      .values(fileUpload)
      .returning();
    return newFileUpload;
  }

  async getFileUploadById(id: string): Promise<FileUpload | undefined> {
    const [fileUpload] = await db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.id, id));
    return fileUpload || undefined;
  }

  async updateFileUpload(id: string, updates: Partial<FileUpload>): Promise<FileUpload | undefined> {
    const [updatedFileUpload] = await db
      .update(fileUploads)
      .set(updates)
      .where(eq(fileUploads.id, id))
      .returning();
    return updatedFileUpload || undefined;
  }

  async getFileUploadsByUserId(userId: number): Promise<FileUpload[]> {
    return db
      .select()
      .from(fileUploads)
      .where(eq(fileUploads.userId, userId))
      .orderBy(desc(fileUploads.createdAt));
  }

  // Financial analysis operations
  async createFinancialAnalysis(analysis: InsertFinancialAnalysis & { userId: number }): Promise<FinancialAnalysis> {
    const [newAnalysis] = await db
      .insert(financialAnalyses)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getFinancialAnalysesByUserId(userId: number): Promise<FinancialAnalysis[]> {
    return db
      .select()
      .from(financialAnalyses)
      .where(eq(financialAnalyses.userId, userId))
      .orderBy(desc(financialAnalyses.createdAt));
  }

  async getFinancialAnalysisByFileUploadId(fileUploadId: string): Promise<FinancialAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(financialAnalyses)
      .where(eq(financialAnalyses.fileUploadId, fileUploadId));
    return analysis || undefined;
  }

  // User settings operations
  async getUserSettings(userId: number): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async updateUserSettings(userId: number, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const [updatedSettings] = await db
      .insert(userSettings)
      .values({ ...settings, userId })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...settings, updatedAt: new Date() },
      })
      .returning();
    return updatedSettings;
  }
}

export const storage = new DatabaseStorage();
