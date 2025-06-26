import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useInterfaceStyle } from "@/hooks/useInterfaceStyle";
import { SimpleLayout } from "@/interfaces/simple/SimpleLayout";
import { ProfessionalLayout } from "@/interfaces/professional/ProfessionalLayout";

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { isAuthenticated, isLoading } = useAuth();
  const { interfaceStyle } = useInterfaceStyle();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Render the appropriate interface based on user preference
  return interfaceStyle === "professional" ? (
    <ProfessionalLayout conversationId={conversationId} />
  ) : (
    <SimpleLayout conversationId={conversationId} />
  );
}