import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Conversation, Message, FileUpload } from "@/types";

export function useChat() {
  const queryClient = useQueryClient();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: isConversationsLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch messages for current conversation
  const { data: messages = [], isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/conversations", currentConversationId, "messages"],
    enabled: !!currentConversationId,
    staleTime: 30 * 1000, // 30 seconds
  });

  // Create conversation mutation
  const createConversationMutation = useMutation({
    mutationFn: async (title?: string) => {
      const response = await apiRequest("/api/conversations", "POST", {
        title: title || "Nova Conversa",
        status: "active",
      });
      return response.json();
    },
    onSuccess: (newConversation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(newConversation.id);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, context }: { content: string; context?: any }) => {
      if (!currentConversationId) {
        throw new Error("No conversation selected");
      }

      const response = await apiRequest("/api/chat/message", "POST", {
        conversationId: currentConversationId,
        content,
        context,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations", currentConversationId, "messages"],
      });
    },
  });

  // Upload file mutation
  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, conversationId }: { file: File; conversationId: string }) => {
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
    onSuccess: () => {
      // Optionally refresh file uploads or conversations
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
  });

  const createConversation = useCallback(
    async (title?: string) => {
      return createConversationMutation.mutateAsync(title);
    },
    [createConversationMutation]
  );

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  const sendMessage = useCallback(
    async (content: string, context?: any) => {
      if (!currentConversationId) {
        // Create a new conversation if none exists
        const newConversation = await createConversation("Nova Conversa");
        setCurrentConversationId(newConversation.id);
        
        // Send message to new conversation
        return sendMessageMutation.mutateAsync({ content, context });
      }
      
      return sendMessageMutation.mutateAsync({ content, context });
    },
    [currentConversationId, createConversation, sendMessageMutation]
  );

  const uploadFile = useCallback(
    async (file: File, conversationId?: string) => {
      const targetConversationId = conversationId || currentConversationId;
      
      if (!targetConversationId) {
        // Create a new conversation if none exists
        const newConversation = await createConversation(file.name);
        return uploadFileMutation.mutateAsync({ 
          file, 
          conversationId: newConversation.id 
        });
      }
      
      return uploadFileMutation.mutateAsync({ 
        file, 
        conversationId: targetConversationId 
      });
    },
    [currentConversationId, createConversation, uploadFileMutation]
  );

  const currentConversation = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId) || null
    : null;

  return {
    conversations,
    currentConversation,
    messages,
    isLoading: isConversationsLoading || isMessagesLoading,
    isSendingMessage: sendMessageMutation.isPending,
    isUploadingFile: uploadFileMutation.isPending,
    createConversation,
    selectConversation,
    sendMessage,
    uploadFile,
  };
}
