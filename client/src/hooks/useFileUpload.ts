import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { FileUpload } from "@/types";

interface UseFileUploadOptions {
  onUploadComplete?: (file: FileUpload) => void;
  onUploadError?: (error: string) => void;
}

export function useFileUpload(options?: UseFileUploadOptions) {
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());

  const uploadFile = useCallback(
    async (file: File, conversationId: string): Promise<FileUpload> => {
      const fileId = `${file.name}-${Date.now()}`;
      
      try {
        // Start tracking upload progress
        setUploadingFiles(prev => new Map(prev.set(fileId, 0)));

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

        const result = await response.json();
        const fileUpload = result.fileUpload;

        // Mark as complete
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });

        options?.onUploadComplete?.(fileUpload);
        return fileUpload;

      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });

        const errorMessage = error instanceof Error ? error.message : "Upload failed";
        options?.onUploadError?.(errorMessage);
        throw error;
      }
    },
    [options]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[], conversationId: string): Promise<FileUpload[]> => {
      const uploadPromises = files.map(file => uploadFile(file, conversationId));
      return Promise.all(uploadPromises);
    },
    [uploadFile]
  );

  const isUploading = uploadingFiles.size > 0;

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    uploadingFiles: Array.from(uploadingFiles.keys()),
  };
}

export function useFileStatus(fileId: string | null) {
  return useQuery<FileUpload>({
    queryKey: ["/api/files", fileId, "status"],
    enabled: !!fileId,
    refetchInterval: (data) => {
      // Poll every 2 seconds if file is still processing
      return data?.status === "processing" ? 2000 : false;
    },
    staleTime: 1000, // 1 second
  });
}

// Utility function to validate file types and sizes
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (file.size > maxSize) {
    return {
      valid: false,
      error: `Arquivo muito grande. Tamanho máximo: 10MB`
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Tipo de arquivo não suportado. Tipos aceitos: PDF, Excel, CSV, JPG, PNG, Word`
    };
  }

  return { valid: true };
}
