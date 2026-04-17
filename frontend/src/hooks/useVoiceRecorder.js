import { useState, useRef, useCallback, useEffect } from 'react'

const API_URL = 'http://localhost:8000'
const MAX_SECONDS = 30

export default function useVoiceRecorder() {
    const [status, setStatus] = useState('idle')
    // idle | listening | processing | responding | error
    const [messages, setMessages] = useState([])
    const [timer, setTimer] = useState(0)
    const [errorMessage, setErrorMessage] = useState('')
    const [audioUrl, setAudioUrl] = useState(null)

    const recorderRef = useRef(null)
    const chunksRef = useRef([])
    const timerRef = useRef(null)
    const streamRef = useRef(null)
    const audioRef = useRef(null)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            clearInterval(timerRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    const startRecording = useCallback(async () => {
        try {
            setErrorMessage('')

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : ''

            const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {})
            recorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                clearInterval(timerRef.current)
                stream.getTracks().forEach(t => t.stop())
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
                sendAudio(blob)
            }

            recorder.start(250)
            setStatus('listening')
            setTimer(0)

            let sec = 0
            timerRef.current = setInterval(() => {
                sec++
                setTimer(sec)
                if (sec >= MAX_SECONDS) {
                    recorderRef.current?.stop()
                }
            }, 1000)

        } catch (err) {
            setStatus('error')
            setErrorMessage(
                err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
                    ? 'Microphone permission denied. Please allow microphone access in your browser settings.'
                    : 'Could not access microphone. Please check your device.'
            )
        }
    }, [])

    const stopRecording = useCallback(() => {
        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop()
        }
    }, [])

    const interruptAndRecord = useCallback(async () => {
        // Stop any currently playing audio immediately
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }
        // Start a new recording right away
        await startRecording()
    }, [startRecording])

    const sendAudio = async (blob) => {
        setStatus('processing')
        try {
            const formData = new FormData()
            formData.append('audio', blob, 'recording.webm')

            const res = await fetch(`${API_URL}/voice-query`, {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Server error')
            }

            const data = await res.json()

            const newMsgs = []
            if (data.transcript) {
                newMsgs.push({ role: 'user', text: data.transcript })
            }
            if (data.response_text) {
                newMsgs.push({ role: 'bot', text: data.response_text, audioUrl: data.audio_url })
            }
            setMessages(prev => [...prev, ...newMsgs])
            setAudioUrl(data.audio_url || null)
            setStatus('responding')

            // Auto-play the response audio
            if (data.audio_url) {
                const audio = new Audio(data.audio_url)
                audioRef.current = audio
                audio.onended = () => {
                    audioRef.current = null
                    setStatus('idle')
                }
                audio.play().catch(() => { })
            }

        } catch (err) {
            setStatus('error')
            setErrorMessage(err.message || 'Failed to process your query. Please try again.')
        }
    }

    const reset = useCallback(() => {
        clearInterval(timerRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        setStatus('idle')
        setMessages([])
        setTimer(0)
        setAudioUrl(null)
        setErrorMessage('')
    }, [])

    return {
        status,
        messages,
        timer,
        errorMessage,
        audioUrl,
        startRecording,
        stopRecording,
        interruptAndRecord,
        reset,
    }
}
