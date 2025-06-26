import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { validateFile } from "@/hooks/useFileUpload";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import { getFileIcon } from "@/lib/authUtils";

interface FileUploadProps {
  onFileUpload: (files: File[]) => Promise<void>;
  onClose: () => void;
  isUploading: boolean;
}

export function FileUpload({ onFileUpload, onClose, isUploading }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    const validFiles: File[] = [];
    const newErrors: string[] = [];

    // Validate accepted files
    acceptedFiles.forEach(file => {
      const validation = validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        newErrors.push(`${file.name}: ${validation.error}`);
      }
    });

    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      const errorMessages = errors.map((e: any) => e.message).join(", ");
      newErrors.push(`${file.name}: ${errorMessages}`);
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);
    setErrors(newErrors);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await onFileUpload(selectedFiles);
      setSelectedFiles([]);
      setErrors([]);
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="upload-area rounded-2xl p-8">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-foreground">Enviar Documentos</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <h4 className="text-lg font-medium text-foreground mb-2">
            {isDragActive ? "Solte os arquivos aqui" : "Arraste e solte seus documentos"}
          </h4>
          <p className="text-muted-foreground mb-4">ou clique para selecionar</p>
          <p className="text-sm text-muted-foreground mb-4">
            Suporte: PDF, Excel, CSV, Imagens (até 10MB cada)
          </p>
          <Button variant="outline" disabled={isUploading}>
            Selecionar Arquivos
          </Button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <Alert className="mt-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-foreground mb-3">
            Arquivos Selecionados ({selectedFiles.length})
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-background rounded flex items-center justify-center">
                    <span className="text-lg">
                      {getFileIcon(file.name.split('.').pop() || '')}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-48">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Enviando arquivos...</span>
          </div>
          <Progress value={undefined} className="w-full" />
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={isUploading || selectedFiles.length === 0}
            className="bg-primary hover:bg-primary/90"
          >
            {isUploading ? "Enviando..." : `Enviar ${selectedFiles.length} arquivo(s)`}
          </Button>
        </div>
      )}
    </div>
  );
}
