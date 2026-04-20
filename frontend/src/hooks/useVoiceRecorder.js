import { useState, useRef, useCallback, useEffect } from 'react'

const API_URL = 'http://localhost:8000'
const MAX_SECONDS = 30
const GENERIC_ERROR = 'Please, try again'

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
    const [errorMessage, setErrorMessage] = useState('')
    const [audioUrl, setAudioUrl] = useState(null)

    const recorderRef = useRef(null)
    const chunksRef = useRef([])
    const timerRef = useRef(null)
    const streamRef = useRef(null)
    const audioRef = useRef(null)
    const messagesRef = useRef(messages)
    const analyserRef = useRef(null)
    const audioCtxRef = useRef(null)

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    const teardownAnalyser = () => {
        analyserRef.current = null
        if (audioCtxRef.current) {
            try { audioCtxRef.current.close() } catch { /* ignore */ }
            audioCtxRef.current = null
        }
    }

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current)
            streamRef.current?.getTracks().forEach(t => t.stop())
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
            teardownAnalyser()
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

            try {
                const AC = window.AudioContext || window.webkitAudioContext
                const audioCtx = new AC()
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume().catch(() => { })
                }
                const source = audioCtx.createMediaStreamSource(stream)
                const analyser = audioCtx.createAnalyser()
                analyser.fftSize = 128
                analyser.smoothingTimeConstant = 0.75
                source.connect(analyser)
                audioCtxRef.current = audioCtx
                analyserRef.current = analyser
            } catch {
                /* non-critical */
            }

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            recorder.onstop = () => {
                clearInterval(timerRef.current)
                stream.getTracks().forEach(t => t.stop())
                teardownAnalyser()
                const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
                sendAudio(blob)
            }

            recorder.start(250)
            setStatus('listening')

            // Auto-stop after MAX_SECONDS. Timer is internal-only, not exposed.
            let sec = 0
            timerRef.current = setInterval(() => {
                sec++
                if (sec >= MAX_SECONDS) {
                    recorderRef.current?.stop()
                }
            }, 1000)

        } catch {
            setStatus('error')
            setErrorMessage(GENERIC_ERROR)
        }
    }, [])

    const stopRecording = useCallback(() => {
        if (recorderRef.current?.state === 'recording') {
            recorderRef.current.stop()
        }
    }, [])

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
                throw new Error(GENERIC_ERROR)
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

        } catch {
            setStatus('error')
            setErrorMessage(GENERIC_ERROR)
        }
    }

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
                throw new Error(GENERIC_ERROR)
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

        } catch {
            setStatus('error')
            setErrorMessage(GENERIC_ERROR)
        }
    }, [])

    const reset = useCallback(() => {
        clearInterval(timerRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        teardownAnalyser()
        setStatus('idle')
        setMessages([])
        setAudioUrl(null)
        setErrorMessage('')
    }, [])

    return {
        status,
        messages,
        errorMessage,
        audioUrl,
        analyserRef,
        startRecording,
        stopRecording,
        interruptAudio,
        sendTextQuery,
        reset,
    }
}
