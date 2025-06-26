import { useState, useRef } from 'react'
import { Mic, Play, Pause, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AudioRecorder({ 
  onAudioReady, 
  className = '',
  variant = 'blue', // 'blue' or 'purple'
  size = 18 
}) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)
  
  const mediaRecorderRef = useRef(null)
  const audioRef = useRef(null)

  const colors = {
    blue: {
      preview: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      button: 'bg-blue-600 hover:bg-blue-700',
      spinner: 'border-blue-600',
      indicator: 'text-blue-600 dark:text-blue-400'
    },
    purple: {
      preview: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
      text: 'text-purple-800 dark:text-purple-200',
      button: 'bg-purple-600 hover:bg-purple-700',
      spinner: 'border-purple-600',
      indicator: 'text-purple-600 dark:text-purple-400'
    }
  }

  const colorScheme = colors[variant]

  const transcribeAudio = async (blob) => {
    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.wav')
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        setTranscription(result.transcription)
        return result.transcription
      }
    } catch (error) {
      console.error('Erro na transcrição:', error)
    } finally {
      setIsTranscribing(false)
    }
    return ''
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
        const url = URL.createObjectURL(blob)
        setAudioBlob(blob)
        setAudioUrl(url)
        
        const transcriptionText = await transcribeAudio(blob)
        
        // Callback para o componente pai
        onAudioReady && onAudioReady({
          audioBlob: blob,
          audioUrl: url,
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

  const clearAudio = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setTranscription('')
    setIsPlayingAudio(false)
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    onAudioReady && onAudioReady(null)
  }

  const playAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      } else {
        audioRef.current.play()
        setIsPlayingAudio(true)
      }
    }
  }

  return (
    <div className={className}>
      {/* Botão de microfone */}
      <motion.button
        type="button"
        onClick={toggleRecording}
        whileTap={{ scale: 0.95 }}
        className={`p-1.5 transition-all duration-200 rounded-xl backdrop-blur-sm ${
          isRecording 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
        }`}
        title={isRecording ? 'Parar gravação' : 'Gravar áudio'}
      >
        {isRecording ? (
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Mic size={size} />
          </motion.div>
        ) : (
          <Mic size={size} />
        )}
      </motion.button>

      {/* Preview do áudio gravado */}
      {audioBlob && (
        <div className={`mb-3 p-4 ${colorScheme.preview} border rounded-lg`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className={`text-sm font-medium ${colorScheme.text}`}>Áudio Gravado</span>
            </div>
            <button
              onClick={clearAudio}
              className="text-gray-500 hover:text-red-500 transition-colors"
              title="Remover áudio"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={playAudio}
              className={`p-2 ${colorScheme.button} text-white rounded-full transition-colors`}
              title={isPlayingAudio ? 'Pausar áudio' : 'Reproduzir áudio'}
            >
              {isPlayingAudio ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <div className="flex-1 text-sm text-gray-600 dark:text-gray-400">
              Clique no botão para ouvir sua gravação
            </div>
          </div>

          {isTranscribing && (
            <div className={`flex items-center gap-2 text-sm ${colorScheme.indicator} mb-2`}>
              <div className={`w-4 h-4 border-2 ${colorScheme.spinner} border-t-transparent rounded-full animate-spin`}></div>
              Transcrevendo áudio...
            </div>
          )}

          {transcription && (
            <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border">
              <div className="text-xs text-gray-500 mb-1">Transcrição:</div>
              <div className="italic">"{transcription}"</div>
            </div>
          )}

          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={() => setIsPlayingAudio(false)}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}