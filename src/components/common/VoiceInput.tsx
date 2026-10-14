import React, { useState, useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, AlertCircle, CheckCircle2, Globe, Loader2 } from 'lucide-react'

export interface VoiceInputProps {
  onTranscript: (text: string) => void
  currentValue?: string
  className?: string
}

export type VoiceState = 'idle' | 'listening' | 'processing' | 'completed' | 'error'

const SUPPORTED_LANGUAGES = [
  { code: 'hi-IN', label: 'Hindi (हिन्दी)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  { code: 'as-IN', label: 'Assamese (অসমীয়া)' },
]

export const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, currentValue = '', className = '' }) => {
  const [selectedLang, setSelectedLang] = useState('hi-IN')
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [interimText, setInterimText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
    }
  }, [])

  const startListening = () => {
    setErrorMessage(null)
    setInterimText('')

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      setErrorMessage('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.')
      setVoiceState('error')
      return
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.lang = selectedLang
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1

      recognition.onstart = () => {
        setVoiceState('listening')
      }

      recognition.onresult = (event: any) => {
        let finalChunk = ''
        let interimChunk = ''

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i]
          if (item.isFinal) {
            finalChunk += item[0].transcript
          } else {
            interimChunk += item[0].transcript
          }
        }

        if (interimChunk) {
          setInterimText(interimChunk)
        }

        if (finalChunk) {
          setInterimText('')
          const trimmed = finalChunk.trim()
          if (trimmed) {
            const separator = currentValue && !currentValue.endsWith(' ') ? ' ' : ''
            onTranscript(`${currentValue}${separator}${trimmed}`)
          }
        }
      }

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error)
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setErrorMessage('Microphone access was denied. Please allow microphone permissions in browser settings.')
        } else if (event.error === 'no-speech') {
          setErrorMessage('No speech detected. Please speak closer to the microphone.')
        } else if (event.error === 'network') {
          setErrorMessage('Network connection error occurred during voice transcription.')
        } else {
          setErrorMessage(`Speech recognition error: ${event.error}`)
        }
        setVoiceState('error')
      }

      recognition.onend = () => {
        if (voiceState === 'listening') {
          setVoiceState('completed')
        }
      }

      recognition.start()
    } catch (err: any) {
      console.error('Failed to initialize speech recognition:', err)
      setErrorMessage(err.message || 'Could not start microphone.')
      setVoiceState('error')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      setVoiceState('processing')
      recognitionRef.current.stop()
      setTimeout(() => {
        setVoiceState('completed')
      }, 400)
    }
  }

  const handleToggle = () => {
    if (voiceState === 'listening') {
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <div className={`p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700 text-xs uppercase tracking-wider">Voice Dictation:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            disabled={voiceState === 'listening'}
            className="bg-white border border-slate-300 rounded px-2.5 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600 disabled:opacity-50"
            aria-label="Select voice dictation language"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {!isSupported ? (
            <span className="text-xs text-amber-700 flex items-center gap-1 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" /> Browser Speech API not supported
            </span>
          ) : (
            <button
              type="button"
              onClick={handleToggle}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-xs ${
                voiceState === 'listening'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : voiceState === 'processing'
                  ? 'bg-amber-600 text-white cursor-wait'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white'
              }`}
            >
              {voiceState === 'listening' ? (
                <>
                  <MicOff className="w-3.5 h-3.5" /> Stop Dictation
                </>
              ) : voiceState === 'processing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" /> Dictate in {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.label.split(' ')[0]}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Visual Feedback Bar */}
      {voiceState === 'listening' && (
        <div className="mt-3 flex items-center justify-between gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-900 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
            </span>
            <span className="font-medium">Listening... Speak clearly into your microphone</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">(Click Stop when finished)</span>
        </div>
      )}

      {interimText && (
        <div className="mt-2 text-xs italic text-slate-600 bg-white p-2 rounded border border-dashed border-slate-300">
          <span className="text-slate-400 not-italic mr-1">Transcribing:</span>
          "{interimText}"
        </div>
      )}

      {voiceState === 'completed' && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
          <span>Speech transcribed and appended below. You may edit or add to the description freely.</span>
        </div>
      )}

      {errorMessage && (
        <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-800 bg-rose-50 p-2 rounded border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  )
}
