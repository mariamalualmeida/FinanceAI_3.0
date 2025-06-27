import { useState, useRef } from 'react'
import { Send, Paperclip, X, FileText, Image, File, Loader2, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import AudioRecorder from './AudioRecorder'

export default function InputAreaFixed({ onSend, onFileUpload, isProcessing = false, uploadProgress = null }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [audioData, setAudioData] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [pendingTranscription, setPendingTranscription] = useState(null)
  const textareaRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleSend = () => {
    if (!text.trim() && files.length === 0 && !audioData) return
    if (isProcessing) return
    
    const finalText = text || (audioData?.transcription ? audioData.transcription : '')
    
    if (audioData) {
      onSend(finalText, files, audioData)
    } else {
      onSend(finalText, files)
    }
    
    setText('')
    setFiles([])
    setAudioData(null)
    setPendingTranscription(null)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ]
    
    const validFiles = droppedFiles.filter(file => allowedTypes.includes(file.type))
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles])
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleTranscriptionComplete = (transcription) => {
    setPendingTranscription(transcription)
  }

  const acceptTranscription = () => {
    if (pendingTranscription) {
      setText(pendingTranscription)
      setPendingTranscription(null)
    }
  }

  const rejectTranscription = () => {
    setPendingTranscription(null)
  }

  const isDisabled = isProcessing || uploadProgress !== null

  return (
    <div className="relative px-6 py-4 bg-transparent">
      <div className="max-w-6xl mx-auto relative">
        {/* Transcription preview modal - integrado */}
        {pendingTranscription && (
          <div className="audio-transcription-integrated">
            <div className="transcription-header">
              <h4 className="text-minimal-base">🎙️ Áudio Gravado</h4>
              <button
                onClick={rejectTranscription}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="transcription-text">
              "{pendingTranscription}"
            </div>
            <div className="transcription-actions">
              <button
                onClick={rejectTranscription}
                className="transcription-btn reject"
              >
                ✗ Cancelar
              </button>
              <button
                onClick={acceptTranscription}
                className="transcription-btn accept"
              >
                ✓ Usar Texto
              </button>
            </div>
          </div>
        )}

        {/* Main input container */}
        <div className={`input-container-final border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 transition-all duration-200 ${
          isDragOver ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
        }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* File attachments display */}
          {files.length > 0 && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                    {file.type.startsWith('image/') ? (
                      <Image size={16} className="text-blue-500" />
                    ) : file.type === 'application/pdf' ? (
                      <FileText size={16} className="text-red-500" />
                    ) : (
                      <File size={16} className="text-gray-500" />
                    )}
                    <span className="text-minimal-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-gray-500 hover:text-red-500 btn-minimal"
                      disabled={isDisabled}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload progress */}
          {uploadProgress && (
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <Loader2 size={16} className="animate-spin text-blue-500" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-minimal-sm text-gray-600 dark:text-gray-400">Processando arquivo...</span>
                    <span className="text-minimal-sm text-gray-600 dark:text-gray-400">{uploadProgress.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress.progress}%` }}
                    />
                  </div>
                  {uploadProgress.fileName && (
                    <div className="text-minimal-sm text-gray-500 dark:text-gray-400 mt-1">
                      {uploadProgress.fileName}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="flex items-end gap-2 p-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="input-textarea-final-fix w-full resize-none border-0 outline-none bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 py-3 px-3 text-base leading-6 min-h-[48px] mobile-textarea-scroll"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                disabled={isDisabled}
                rows={1}
              />
              
              {/* Action buttons - positioned absolutely within textarea */}
              <div className="input-buttons-final">
                {/* File upload button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-minimal p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isDisabled}
                  title="Anexar arquivo"
                >
                  <Paperclip size={18} />
                </button>

                {/* Audio recorder */}
                <AudioRecorder
                  onTranscriptionComplete={handleTranscriptionComplete}
                  onAudioReady={setAudioData}
                  disabled={isDisabled}
                />

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={(!text.trim() && files.length === 0 && !audioData) || isDisabled}
                  className="btn-minimal p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title="Enviar mensagem"
                >
                  {isProcessing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500 rounded-xl flex items-center justify-center">
            <div className="text-blue-600 dark:text-blue-400 text-center">
              <Upload size={32} className="mx-auto mb-2" />
              <p className="text-minimal-base font-medium">Solte os arquivos aqui</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}