import { useState } from 'react'

export function useFileUpload() {
  const [uploadProgress, setUploadProgress] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  const uploadFiles = async (files, message = '') => {
    setIsUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    if (message.trim()) formData.append('message', message)

    try {
      const uploadPromise = fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      // Simular progresso
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressTimer)
            return 90
          }
          return prev + Math.random() * 15
        })
      }, 300)

      const response = await uploadPromise
      const result = await response.json()
      
      clearInterval(progressTimer)
      setUploadProgress(100)
      
      // Aguardar um pouco para mostrar 100%
      setTimeout(() => {
        setUploadProgress(null)
        setIsUploading(false)
      }, 500)

      return { success: response.ok, result }
    } catch (error) {
      setUploadProgress(null)
      setIsUploading(false)
      throw error
    }
  }

  const resetUpload = () => {
    setUploadProgress(null)
    setIsUploading(false)
  }

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    resetUpload
  }
}