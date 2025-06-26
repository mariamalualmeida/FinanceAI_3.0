import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  role: varchar("role", { length: 50 }).default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversations table
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: varchar("title", { length: 255 }),
  status: varchar("status", { length: 50 }).default("active"), // active, archived
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id),
  role: varchar("role", { length: 20 }).notNull(), // user, assistant, system
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // For storing analysis results, file references, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// File uploads table
export const fileUploads = pgTable("file_uploads", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: varchar("mime_type", { length: 100 }),
  status: varchar("status", { length: 50 }).default("pending"), // pending, processing, completed, error
  processingResult: jsonb("processing_result"), // Results from document processing
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial analyses table
export const financialAnalyses = pgTable("financial_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  conversationId: uuid("conversation_id").references(() => conversations.id),
  fileUploadId: uuid("file_upload_id").references(() => fileUploads.id),
  analysisType: varchar("analysis_type", { length: 50 }).notNull(), // credit_score, risk_analysis, betting_detection
  results: jsonb("results").notNull(), // Analysis results
  score: decimal("score", { precision: 5, scale: 2 }), // Credit score or risk score
  riskLevel: varchar("risk_level", { length: 20 }), // low, medium, high
  createdAt: timestamp("created_at").defaultNow(),
});

// User settings table
export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id).unique(),
  theme: varchar("theme", { length: 20 }).default("light"),
  primaryColor: varchar("primary_color", { length: 20 }).default("blue"),
  interfaceStyle: varchar("interface_style", { length: 20 }).default("simple"),
  llmProvider: varchar("llm_provider", { length: 50 }).default("openai"),
  llmApiKey: text("llm_api_key"), // Encrypted
  anonymizationEnabled: boolean("anonymization_enabled").default(true),
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  settings: jsonb("settings"), // Additional user preferences
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  conversations: many(conversations),
  fileUploads: many(fileUploads),
  financialAnalyses: many(financialAnalyses),
  settings: one(userSettings),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  messages: many(messages),
  fileUploads: many(fileUploads),
  financialAnalyses: many(financialAnalyses),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const fileUploadsRelations = relations(fileUploads, ({ one, many }) => ({
  user: one(users, {
    fields: [fileUploads.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [fileUploads.conversationId],
    references: [conversations.id],
  }),
  financialAnalyses: many(financialAnalyses),
}));

export const financialAnalysesRelations = relations(financialAnalyses, ({ one }) => ({
  user: one(users, {
    fields: [financialAnalyses.userId],
    references: [users.id],
  }),
  conversation: one(conversations, {
    fields: [financialAnalyses.conversationId],
    references: [conversations.id],
  }),
  fileUpload: one(fileUploads, {
    fields: [financialAnalyses.fileUploadId],
    references: [fileUploads.id],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(users, {
    fields: [userSettings.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  status: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  role: true,
  content: true,
  metadata: true,
});

export const insertFileUploadSchema = createInsertSchema(fileUploads).pick({
  conversationId: true,
  originalName: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  mimeType: true,
});

export const insertFinancialAnalysisSchema = createInsertSchema(financialAnalyses).pick({
  conversationId: true,
  fileUploadId: true,
  analysisType: true,
  results: true,
  score: true,
  riskLevel: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  theme: true,
  primaryColor: true,
  llmProvider: true,
  llmApiKey: true,
  anonymizationEnabled: true,
  twoFactorEnabled: true,
  settings: true,
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
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
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
