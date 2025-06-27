import { useState, useRef } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SimpleAudioRecorder({ onAudioReady, size = 18 }) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef(null)

  const transcribeAudio = async (audioBlob) => {
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'audio.wav')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        return data.transcription || 'Não foi possível transcrever o áudio.'
      } else {
        throw new Error('Falha na transcrição')
      }
    } catch (error) {
      console.error('Erro na transcrição:', error)
      return 'Erro ao transcrever áudio.'
    } finally {
      setIsProcessing(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const audioChunks = []
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }
      
      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunks, { type: 'audio/wav' })
        const transcriptionText = await transcribeAudio(blob)
        
        // Enviar transcrição diretamente para o componente pai
        onAudioReady && onAudioReady({
          transcription: transcriptionText
        })
        
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error)
      alert('Erro ao acessar o microfone. Verifique as permissões.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggleRecording}
      disabled={isProcessing}
      whileTap={{ scale: 0.95 }}
      className={`p-1.5 rounded-lg transition-colors ${
        isRecording 
          ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
          : isProcessing 
          ? 'text-blue-500 animate-pulse'
          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
      title={
        isProcessing ? 'Processando...' :
        isRecording ? 'Parar gravação' : 'Gravar áudio'
      }
    >
      {isRecording ? (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <MicOff size={size} />
        </motion.div>
      ) : (
        <Mic size={size} />
      )}
    </motion.button>
  )
}