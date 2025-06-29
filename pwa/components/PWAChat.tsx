import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import { Card } from '@shared/components/ui/card';
import { Upload, Send, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { PWAFileUpload } from './PWAFileUpload';
import { PWAMessageList } from './PWAMessageList';
import { OfflineStorage } from '../storage/OfflineStorage';

export function PWAChat() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const storage = new OfflineStorage();

  // Load conversations (from cache or API)
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      if (navigator.onLine) {
        const response = await fetch('/api/lite/conversations');
        if (response.ok) {
          const data = await response.json();
          await storage.storeConversations(data);
          return data;
        }
      }
      return await storage.getConversations();
    },
  });

  // Load messages for current conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return [];
      
      if (navigator.onLine) {
        const response = await fetch(`/api/lite/conversations/${currentConversationId}/messages`);
        if (response.ok) {
          const data = await response.json();
          await storage.storeMessages(currentConversationId, data);
          return data;
        }
      }
      return await storage.getMessages(currentConversationId);
    },
    enabled: !!currentConversationId,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, conversationId }: { message: string; conversationId?: string }) => {
      if (navigator.onLine) {
        const response = await fetch('/api/lite/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, conversationId }),
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        return response.json();
      } else {
        const offlineMessage = {
          id: `offline_${Date.now()}`,
          content: message,
          role: 'user',
          conversationId: conversationId || 'offline_conversation',
          timestamp: new Date().toISOString(),
          offline: true
        };
        
        await storage.storeOfflineMessage(offlineMessage);
        return { message: offlineMessage, conversationId: offlineMessage.conversationId };
      }
    },
    onSuccess: (data) => {
      setMessage('');
      if (data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', data.conversationId] });
    },
  });

  const createConversation = async () => {
    const newId = `conv_${Date.now()}`;
    setCurrentConversationId(newId);
    
    if (navigator.onLine) {
      try {
        const response = await fetch('/api/lite/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Nova Conversa' }),
        });
        
        if (response.ok) {
          const conversation = await response.json();
          setCurrentConversationId(conversation.id);
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
        }
      } catch (error) {
        console.error('Failed to create conversation online:', error);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      message: message.trim(),
      conversationId: currentConversationId || undefined,
    });
  };

  const handleFileUpload = () => {
    setShowUpload(true);
  };

  return (
    <div className="flex h-full">
      {/* Sidebar - Conversations */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="p-4">
          <Button onClick={createConversation} className="w-full mb-4">
            Nova Conversa
          </Button>
          
          <div className="space-y-2">
            {conversations.map((conv: any) => (
              <Card
                key={conv.id}
                className={`p-3 cursor-pointer transition-colors ${
                  currentConversationId === conv.id
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setCurrentConversationId(conv.id)}
              >
                <p className="text-sm font-medium truncate">{conv.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(conv.createdAt).toLocaleDateString()}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {currentConversationId ? (
            <PWAMessageList messages={messages} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Bem-vindo ao FinanceAI PWA</p>
                <p>Selecione uma conversa ou crie uma nova para começar</p>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
            >
              <Upload className="h-4 w-4" />
            </Button>
            
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            <Button
              type="submit"
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>

      {showUpload && (
        <PWAFileUpload
          conversationId={currentConversationId}
          onClose={() => setShowUpload(false)}
          onUploadComplete={() => {
            setShowUpload(false);
            queryClient.invalidateQueries({ queryKey: ['messages', currentConversationId] });
          }}
        />
      )}
    </div>
  );
}