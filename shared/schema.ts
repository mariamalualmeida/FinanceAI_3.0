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
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabela de mensagens
export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  conversationId: uuid("conversation_id").references(() => conversations.id).notNull(),
  sender: varchar("sender", { length: 20 }).notNull(), // 'user' ou 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"), // Para arquivos anexados, etc.
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Tabela de uploads de arquivos
export const fileUploads = pgTable("file_uploads", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  userId: integer("user_id").references(() => users.id).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id),
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
  conversationId: uuid("conversation_id").references(() => conversations.id),
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

// Tabela de base de conhecimento
export const knowledgeBase = pgTable("knowledge_base", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  content: text("content").notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  category: varchar("category", { length: 100 }).default("general"),
  tags: varchar("tags", { length: 500 }),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  filePath: varchar("file_path", { length: 500 }),
  fileSize: integer("file_size"),
  embedding: text("embedding"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabela de configurações do sistema
export const systemConfig = pgTable("system_config", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  key: varchar("key", { length: 100 }).unique().notNull(),
  value: text("value"),
  description: text("description"),
  category: varchar("category", { length: 50 }).default("general"),
  isSecret: boolean("is_secret").default(false),
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertKnowledgeBaseSchema = createInsertSchema(knowledgeBase).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true
});

export type KnowledgeBase = typeof knowledgeBase.$inferSelect;
export type InsertKnowledgeBase = z.infer<typeof insertKnowledgeBaseSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof loginSchema>;

// Tabela de configurações de LLM
export const llmConfig = pgTable("llm_config", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(), // openai, anthropic, google
  displayName: varchar("display_name", { length: 100 }).notNull(),
  apiKey: text("api_key"),
  baseUrl: varchar("base_url", { length: 500 }),
  model: varchar("model", { length: 100 }).notNull(),
  isEnabled: boolean("is_enabled").default(true),
  isPrimary: boolean("is_primary").default(false),
  isBackup: boolean("is_backup").default(false),
  maxTokens: integer("max_tokens").default(4000),
  temperature: decimal("temperature", { precision: 3, scale: 2 }).default("0.7"),
  specialty: varchar("specialty", { length: 200 }), // financial_analysis, creative, technical
  priority: integer("priority").default(1), // Para ordem de backup
  config: jsonb("config"), // Configurações específicas do provider
  updatedBy: integer("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabela de prompts do sistema
export const systemPrompts = pgTable("system_prompts", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // financial_analysis, general, etc
  prompt1: text("prompt_1"), // Sistema base
  prompt2: text("prompt_2"), // Extração
  prompt3: text("prompt_3"), // Validação
  prompt4: text("prompt_4"), // Categorização
  prompt5: text("prompt_5"), // Análise
  prompt6: text("prompt_6"), // Score
  prompt7: text("prompt_7"), // Riscos
  prompt8: text("prompt_8"), // Recomendações
  prompt9: text("prompt_9"), // Extra 1
  prompt10: text("prompt_10"), // Extra 2
  prompt11: text("prompt_11"), // Extra 3
  prompt12: text("prompt_12"), // Extra 4
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabela de configurações de estratégia Multi-LLM
export const multiLlmStrategy = pgTable("multi_llm_strategy", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  name: varchar("name", { length: 100 }).notNull(),
  mode: varchar("mode", { length: 50 }).notNull(), // economic, balanced, premium
  enableSubjectRouting: boolean("enable_subject_routing").default(false),
  enableBackupSystem: boolean("enable_backup_system").default(true),
  enableValidation: boolean("enable_validation").default(false),
  routingRules: jsonb("routing_rules"), // Regras de roteamento por assunto
  validationRules: jsonb("validation_rules"), // Regras de validação
  isActive: boolean("is_active").default(false),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedBy: integer("updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertLlmConfigSchema = createInsertSchema(llmConfig).omit({
  id: true,
  updatedAt: true
});

export const insertSystemPromptsSchema = createInsertSchema(systemPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMultiLlmStrategySchema = createInsertSchema(multiLlmStrategy).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type LlmConfig = typeof llmConfig.$inferSelect;
export type InsertLlmConfig = z.infer<typeof insertLlmConfigSchema>;

export type SystemPrompts = typeof systemPrompts.$inferSelect;
export type InsertSystemPrompts = z.infer<typeof insertSystemPromptsSchema>;

export type MultiLlmStrategy = typeof multiLlmStrategy.$inferSelect;
export type InsertMultiLlmStrategy = z.infer<typeof insertMultiLlmStrategySchema>;