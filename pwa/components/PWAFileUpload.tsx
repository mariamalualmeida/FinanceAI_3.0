import React, { useState } from 'react';

interface PWAFileUploadProps {
  conversationId: string | null;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function PWAFileUpload({ conversationId, onClose, onUploadComplete }: PWAFileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (conversationId) {
        formData.append('conversationId', conversationId);
      }

      if (navigator.onLine) {
        const response = await fetch('/api/lite/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          onUploadComplete();
        }
      } else {
        // Store for offline sync
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          localStorage.setItem(`offline-upload-${Date.now()}`, JSON.stringify({
            filename: file.name,
            data: base64,
            conversationId,
            timestamp: Date.now()
          }));
          onUploadComplete();
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Upload de Arquivo
        </h3>
        
        <input
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.xlsx,.xls,.csv,.jpg,.png,.doc,.docx"
          className="w-full mb-4"
          disabled={uploading}
        />
        
        {uploading && (
          <div className="text-center text-gray-600 dark:text-gray-400">
            Enviando arquivo...
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg"
            disabled={uploading}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}