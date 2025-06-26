import { pgTable, text, varchar, timestamp, integer, boolean, jsonb, uuid, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tabela de usuários
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  username: varchar("username", { length: 50 }).unique().notNull(),
  email: varchar("email", { length: 100 }).unique().notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabela de conversas
export const conversations = pgTable("conversations", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabela de mensagens
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  sender: varchar("sender", { length: 20 }).notNull(), // 'user' ou 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Para arquivos anexados, etc.
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabela de uploads de arquivos
export const fileUploads = pgTable("file_uploads", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileSize: integer("file_size").notNull(),
  fileType: varchar("file_type", { length: 100 }).notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, processing, completed, failed
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabela de análises financeiras
export const financialAnalyses = pgTable("financial_analyses", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  conversationId: integer("conversation_id").references(() => conversations.id),
  fileUploadId: integer("file_upload_id").references(() => fileUploads.id),
  analysisType: varchar("analysis_type", { length: 100 }).notNull(), // credit_score, risk_assessment, pattern_detection
  results: jsonb("results").notNull(), // Resultados da análise em JSON
  score: integer("score"), // Score de crédito (0-1000)
  riskLevel: varchar("risk_level", { length: 50 }), // low, medium, high
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabela de transações extraídas
export const transactions = pgTable("transactions", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  analysisId: integer("analysis_id").references(() => financialAnalyses.id).notNull(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // debit, credit
  category: varchar("category", { length: 100 }),
  subcategory: varchar("subcategory", { length: 100 }),
  isRecurring: boolean("is_recurring").default(false),
  isSuspicious: boolean("is_suspicious").default(false),
  metadata: jsonb("metadata")
});

// Schemas de inserção usando drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).omit({
  id: true,
  createdAt: true
});

export const insertFinancialAnalysisSchema = createInsertSchema(financialAnalyses).omit({
  id: true,
  createdAt: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true
});

// Tipos TypeScript
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type FileUpload = typeof fileUploads.$inferSelect;
export type InsertFileUpload = z.infer<typeof insertFileUploadSchema>;

export type FinancialAnalysis = typeof financialAnalyses.$inferSelect;
export type InsertFinancialAnalysis = z.infer<typeof insertFinancialAnalysisSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;