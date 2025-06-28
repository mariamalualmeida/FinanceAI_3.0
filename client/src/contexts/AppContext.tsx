import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface AppContextType {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Conversation state
  currentConversation: string | null;
  setCurrentConversation: (id: string | null) => void;
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  
  // Chat state
  messages: any[];
  setMessages: (messages: any[]) => void;
  clearChat: () => void;
  
  // UI state
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Actions
  refreshConversations: () => Promise<void>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  createNewConversation: () => Promise<string>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const clearChat = () => {
    setMessages([]);
  };

  const refreshConversations = async () => {
    try {
      const response = await fetch('/api/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (response.ok) {
        await refreshConversations();
      }
    } catch (error) {
      console.error('Error updating conversation title:', error);
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        // Remove from local state
        setConversations(prev => prev.filter(conv => conv.id !== id));
        
        // If deleted conversation was current, clear chat and reset
        if (currentConversation === id) {
          setCurrentConversation(null);
          clearChat();
        }
        
        // Don't close sidebar after deletion
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const createNewConversation = async (): Promise<string> => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: 'Nova Conversa' }),
      });
      
      if (response.ok) {
        const newConversation = await response.json();
        
        // Add to local state
        setConversations(prev => [newConversation, ...prev]);
        
        // Set as current and clear chat
        setCurrentConversation(newConversation.id);
        clearChat();
        
        // Close sidebar only on new conversation creation
        setSidebarOpen(false);
        
        return newConversation.id;
      }
      throw new Error('Failed to create conversation');
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  };

  // Load conversations on user change
  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      clearChat();
    }
  }, [user]);

  const value: AppContextType = {
    user,
    setUser,
    currentConversation,
    setCurrentConversation,
    conversations,
    setConversations,
    messages,
    setMessages,
    clearChat,
    sidebarOpen,
    setSidebarOpen,
    refreshConversations,
    updateConversationTitle,
    deleteConversation,
    createNewConversation,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};