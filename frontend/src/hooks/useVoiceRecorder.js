import { useState, useRef, useCallback, useEffect } from 'react'

const API_URL = 'http://localhost:8000'
const MAX_SECONDS = 30

function makeId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function nowTimestamp() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function useVoiceRecorder(options = {}) {
    const { autoPlay = true } = options

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
    const messagesRef = useRef(messages)

    // Keep ref in sync so async callbacks always see the latest messages
    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

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

    // Stop any audio managed by the hook and return to idle.
    // Does NOT start a new recording — caller must tap mic again.
    const interruptAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current = null
        }
        setStatus('idle')
    }, [])

    const sendAudio = async (blob) => {
        setStatus('processing')
        try {
            const formData = new FormData()
            formData.append('audio', blob, 'recording.webm')

            // Build conversation history from last 6 messages (read from ref)
            const history = messagesRef.current.slice(-6).map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.text,
            }))
            formData.append('history', JSON.stringify(history))

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
                newMsgs.push({
                    id: makeId(),
                    role: 'user',
                    text: data.transcript,
                    timestamp: nowTimestamp(),
                    audioUrl: null,
                })
            }
            if (data.response_text) {
                newMsgs.push({
                    id: makeId(),
                    role: 'bot',
                    text: data.response_text,
                    timestamp: nowTimestamp(),
                    audioUrl: data.audio_url || null,
                })
            }
            setMessages(prev => [...prev, ...newMsgs])
            setAudioUrl(data.audio_url || null)

            // Auto-play only if opted in (VoiceCard = yes, ChatWidget = no)
            if (autoPlay && data.audio_url) {
                setStatus('responding')
                const audio = new Audio(data.audio_url)
                audioRef.current = audio
                audio.onended = () => {
                    audioRef.current = null
                    setStatus('idle')
                }
                audio.play().catch(() => { })
            } else {
                setStatus('idle')
            }

        } catch (err) {
            setStatus('error')
            setErrorMessage(err.message || 'Failed to process your query. Please try again.')
        }
    }

    // Text query: skips STT, hits /text-query endpoint
    const sendTextQuery = useCallback(async (text) => {
        const trimmed = (text || '').trim()
        if (!trimmed) return

        setErrorMessage('')
        setMessages(prev => [...prev, {
            id: makeId(),
            role: 'user',
            text: trimmed,
            timestamp: nowTimestamp(),
            audioUrl: null,
        }])
        setStatus('processing')

        try {
            const history = messagesRef.current.slice(-6).map(m => ({
                role: m.role === 'bot' ? 'assistant' : 'user',
                content: m.text,
            }))

            const res = await fetch(`${API_URL}/text-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: trimmed, history }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Server error')
            }

            const data = await res.json()
            if (data.response_text) {
                setMessages(prev => [...prev, {
                    id: makeId(),
                    role: 'bot',
                    text: data.response_text,
                    timestamp: nowTimestamp(),
                    audioUrl: data.audio_url || null,
                }])
            }
            setAudioUrl(data.audio_url || null)
            setStatus('idle')

        } catch (err) {
            setStatus('error')
            setErrorMessage(err.message || 'Failed to process your query. Please try again.')
        }
    }, [])

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
        interruptAudio,
        sendTextQuery,
        reset,
    }
}
