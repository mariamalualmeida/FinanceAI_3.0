import { apiRequest } from "./queryClient";
import type { 
  Conversation, 
  Message, 
  FileUpload, 
  FinancialAnalysis, 
  UserSettings 
} from "@/types";

// Authentication API
export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await apiRequest("/api/auth/login", "POST", { username, password });
    return response.json();
  },

  register: async (userData: any) => {
    const response = await apiRequest("/api/auth/register", "POST", userData);
    return response.json();
  },

  logout: async () => {
    await apiRequest("/api/auth/logout", "POST");
  },

  getMe: async () => {
    const response = await apiRequest("/api/auth/me", "GET");
    return response.json();
  },
};

// Conversations API
export const conversationAPI = {
  getAll: async (): Promise<Conversation[]> => {
    const response = await apiRequest("/api/conversations", "GET");
    return response.json();
  },

  create: async (title?: string): Promise<Conversation> => {
    const response = await apiRequest("/api/conversations", "POST", {
      title: title || "Nova Conversa",
      status: "active",
    });
    return response.json();
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await apiRequest(`/api/conversations/${conversationId}/messages`, "GET");
    return response.json();
  },
};

// Chat API
export const chatAPI = {
  sendMessage: async (conversationId: string, content: string, context?: any) => {
    const response = await apiRequest("POST", "/api/chat/message", {
      conversationId,
      content,
      context,
    });
    return response.json();
  },
};

// Files API
export const filesAPI = {
  upload: async (file: File, conversationId: string): Promise<{ fileUpload: FileUpload }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversationId", conversationId);

    const response = await fetch("/api/files/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Upload failed");
    }

    return response.json();
  },

  getStatus: async (fileId: string): Promise<FileUpload> => {
    const response = await apiRequest("GET", `/api/files/${fileId}/status`);
    return response.json();
  },
};

// Analysis API
export const analysisAPI = {
  getByFileId: async (fileId: string): Promise<FinancialAnalysis> => {
    const response = await apiRequest("GET", `/api/analysis/${fileId}`);
    return response.json();
  },

  getAll: async (): Promise<FinancialAnalysis[]> => {
    const response = await apiRequest("GET", "/api/analysis");
    return response.json();
  },

  generateReport: async (analysisId: string): Promise<{ report: string }> => {
    const response = await apiRequest("POST", "/api/analysis/generate-report", {
      analysisId,
    });
    return response.json();
  },
};

// Settings API
export const settingsAPI = {
  get: async (): Promise<UserSettings> => {
    const response = await apiRequest("GET", "/api/settings");
    return response.json();
  },

  update: async (settings: Partial<UserSettings>): Promise<UserSettings> => {
    const response = await apiRequest("PUT", "/api/settings", settings);
    return response.json();
  },
};
