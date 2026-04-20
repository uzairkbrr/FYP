import React, { useState, useRef, useEffect } from 'react'
import useVoiceRecorder from '../hooks/useVoiceRecorder'
import LiveWaveform from './LiveWaveform'

const API_URL = 'http://localhost:8000'
const GENERIC_ERROR = 'Please, try again'

// Tap-able starter queries shown just above the input while the chat is empty.
const SUGGESTIONS = [
    'FAST University undergraduate admissions requirements kiya hai?',
    'Kya FAST University mein on-campus hostel facility maujood hai?',
    'BS program ke fees structure kiya hai?',
]

function parseMarkdownLinks(text) {
    const parts = []
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g
    let lastIndex = 0
    let match
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
        }
        parts.push({ type: 'link', label: match[1], url: match[2] })
        lastIndex = match.index + match[0].length
    }
    if (lastIndex < text.length) {
        parts.push({ type: 'text', content: text.slice(lastIndex) })
    }
    return parts
}

function parseBold(text, keyPrefix) {
    const segments = text.split(/\*\*([^*]+)\*\*/g)
    return segments.map((seg, i) =>
        i % 2 === 1
            ? <strong key={`${keyPrefix}-${i}`}>{seg}</strong>
            : <span key={`${keyPrefix}-${i}`}>{seg}</span>
    )
}

function RichText({ text }) {
    const parts = parseMarkdownLinks(text)
    return (
        <>
            {parts.map((part, i) =>
                part.type === 'link' ? (
                    <a
                        key={i}
                        href={part.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: 'var(--primary)',
                            textDecoration: 'underline',
                            wordBreak: 'break-word',
                        }}
                    >
                        {part.label}
                    </a>
                ) : (
                    <React.Fragment key={i}>{parseBold(part.content, `b${i}`)}</React.Fragment>
                )
            )}
        </>
    )
}

// ── Contact Moderator form (inline panel inside the widget) ─────────────────
function ModeratorForm({ onCancel, onSubmitted }) {
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState('')
    const [errors, setErrors] = useState({})
    const [status, setStatus] = useState('idle') // idle | sending | success | error
    const [submitError, setSubmitError] = useState('')

    const validate = () => {
        const next = {}
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!email.trim()) next.email = 'Email is required'
        else if (!emailRe.test(email.trim())) next.email = 'Enter a valid email'
        if (!phone.trim()) next.phone = 'Phone is required'
        if (!message.trim()) next.message = 'Message is required'
        setErrors(next)
        return Object.keys(next).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setStatus('sending')
        setSubmitError('')
        try {
            const res = await fetch(`${API_URL}/contact-moderator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    phone: phone.trim(),
                    message: message.trim(),
                    timestamp: new Date().toISOString(),
                }),
            })
            if (!res.ok) throw new Error(GENERIC_ERROR)
            setStatus('success')
            setTimeout(onSubmitted, 3000)
        } catch {
            setStatus('error')
            setSubmitError(GENERIC_ERROR)
        }
    }

    if (status === 'success') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-text-primary text-base font-bold">Message sent</p>
                <p className="mt-2 text-text-secondary text-sm max-w-[280px]">
                    Your message has been sent. A moderator will follow up on your email shortly.
                </p>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin">
            <div>
                <label className="block text-[12px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                    Your email address
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-text-primary text-base focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
                />
                {errors.email && <p className="mt-1 text-[12px] text-red-600 font-semibold">{errors.email}</p>}
            </div>

            <div>
                <label className="block text-[12px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                    Your contact number
                </label>
                <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-text-primary text-base focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
                />
                {errors.phone && <p className="mt-1 text-[12px] text-red-600 font-semibold">{errors.phone}</p>}
            </div>

            <div>
                <label className="block text-[12px] font-bold text-text-muted uppercase tracking-widest mb-1.5">
                    Your message or query
                </label>
                <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    disabled={status === 'sending'}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-text-primary text-base focus:outline-none focus:border-primary/60 transition-colors resize-none disabled:opacity-50"
                />
                {errors.message && <p className="mt-1 text-[12px] text-red-600 font-semibold">{errors.message}</p>}
            </div>

            {submitError && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-100">
                    <p className="text-red-800 text-sm font-bold text-center">{submitError}</p>
                </div>
            )}

            <div className="flex items-center gap-2 pt-1">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={status === 'sending'}
                    className="flex-1 py-2.5 rounded-lg bg-surface border border-border text-text-primary text-sm font-bold hover:bg-background transition-colors cursor-pointer disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={status === 'sending'}
                    className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-50"
                >
                    {status === 'sending' ? 'Sending' : 'Send to Moderator'}
                </button>
            </div>
        </form>
    )
}

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [showModerator, setShowModerator] = useState(false)
    const [input, setInput] = useState('')
    const [playingId, setPlayingId] = useState(null)

    const {
        status,
        messages,
        errorMessage,
        analyserRef,
        startRecording,
        stopRecording,
        sendTextQuery,
        reset,
    } = useVoiceRecorder({ autoPlay: false })

    const messagesEndRef = useRef(null)
    const audioRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, status])

    useEffect(() => {
        const onOpen = () => {
            setIsOpen(true)
            setTimeout(() => inputRef.current?.focus(), 120)
        }
        const onClose = () => setIsOpen(false)
        window.addEventListener('mahir:open-widget', onOpen)
        window.addEventListener('mahir:close-widget', onClose)
        return () => {
            window.removeEventListener('mahir:open-widget', onOpen)
            window.removeEventListener('mahir:close-widget', onClose)
        }
    }, [])

    const isListening = status === 'listening'
    const isProcessing = status === 'processing'
    const isPlaying = playingId !== null

    const stopCurrentAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        setPlayingId(null)
    }

    const playMessage = (msg) => {
        stopCurrentAudio()
        if (!msg.audioUrl) return
        const audio = new Audio(msg.audioUrl)
        audioRef.current = audio
        audio.onended = () => {
            audioRef.current = null
            setPlayingId(null)
        }
        audio.play().catch(() => {
            audioRef.current = null
            setPlayingId(null)
        })
        setPlayingId(msg.id)
    }

    const handleSpeakerClick = (msg) => {
        if (playingId === msg.id) stopCurrentAudio()
        else playMessage(msg)
    }

    const handleMicClick = () => {
        if (isProcessing) return
        if (isPlaying) {
            stopCurrentAudio()
            return
        }
        if (isListening) stopRecording()
        else startRecording()
    }

    const handleSendText = () => {
        const text = input.trim()
        if (!text || isProcessing) return
        sendTextQuery(text)
        setInput('')
        inputRef.current?.focus()
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendText()
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        if (isListening) stopRecording()
        stopCurrentAudio()
    }

    const handleClearChat = () => {
        stopCurrentAudio()
        reset()
    }

    const hasText = input.trim().length > 0

    // ── Floating trigger button ──
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center cursor-pointer"
                aria-label="Open Mahir on Call"
            >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>
        )
    }

    // ── Chat panel ──
    return (
        <div
            className="fixed bottom-6 right-6 z-50 w-[460px] h-[680px] rounded-2xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
        >
            {/* Header */}
            <div className="px-4 py-3 bg-primary flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <h3 className="text-white font-bold text-base tracking-wide">Mahir on Call</h3>
                </div>
                <div className="flex items-center gap-2">
                    {!showModerator && messages.length > 0 && (
                        <button
                            onClick={handleClearChat}
                            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                            title="Start new conversation"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                    {!showModerator && (
                        <button
                            onClick={() => setShowModerator(true)}
                            className="px-2.5 py-1 rounded-md border border-white/40 text-white text-[12px] font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                            title="Contact Moderator"
                        >
                            Contact Moderator
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Contact Moderator panel replaces the chat body while active */}
            {showModerator ? (
                <ModeratorForm
                    onCancel={() => setShowModerator(false)}
                    onSubmitted={() => setShowModerator(false)}
                />
            ) : (
                <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                        {messages.length === 0 && status === 'idle' && (
                            <div className="flex flex-col items-center justify-center h-full select-none text-center px-6">
                                <svg
                                    className="waving-hand w-14 h-14 text-primary"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={1.5}
                                    aria-hidden="true"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 1 0-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 0 1 3.15 0v1.5m-3.15 0 .075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 0 1 3.15 0V15M6.9 7.575a1.575 1.575 0 1 0-3.15 0v8.175a6.75 6.75 0 0 0 6.75 6.75h2.018a5.25 5.25 0 0 0 3.712-1.538l1.732-1.732a5.25 5.25 0 0 0 1.538-3.712l.003-2.024a.668.668 0 0 1 .198-.471 1.575 1.575 0 1 0-2.228-2.228 3.818 3.818 0 0 0-1.12 2.687M6.9 7.575V12m6.27 4.318A4.49 4.49 0 0 1 16.35 15m.002 0h-.002" />
                                </svg>
                                <p className="mt-5 text-text-primary text-base font-bold">
                                    Hi, I'm Mahir
                                </p>
                                <p className="mt-1 text-text-muted text-sm font-medium">
                                    How can I assist you today?
                                </p>
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isUser = msg.role === 'user'
                            const hasAudio = Boolean(msg.audioUrl)
                            const thisPlaying = playingId === msg.id
                            return (
                                <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                                    <div className={`relative max-w-[82%] ${isUser
                                        ? 'bg-primary text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                                        : `bg-background border border-border text-text-primary rounded-2xl rounded-bl-sm px-4 py-2.5${hasAudio ? ' pr-11' : ''}`
                                        }`}>
                                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                                            {isUser ? msg.text : <RichText text={msg.text} />}
                                        </p>
                                        {!isUser && hasAudio && (
                                            <button
                                                onClick={() => handleSpeakerClick(msg)}
                                                className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer ${thisPlaying
                                                    ? 'bg-primary text-white border border-primary'
                                                    : 'bg-surface border border-border text-primary hover:bg-primary hover:text-white hover:border-primary'
                                                    }`}
                                                title={thisPlaying ? 'Stop audio' : 'Play audio'}
                                                aria-label={thisPlaying ? 'Stop audio' : 'Play audio'}
                                            >
                                                {thisPlaying ? (
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                        <rect x="5" y="5" width="10" height="10" rx="1.5" />
                                                    </svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <span className={`mt-1 text-[11px] text-text-muted font-medium ${isUser ? 'mr-1' : 'ml-1'}`}>
                                        {msg.timestamp}
                                    </span>
                                </div>
                            )
                        })}

                        {/* Thinking indicator */}
                        {isProcessing && (
                            <div className="flex flex-col items-start">
                                <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 bg-text-muted rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        )}

                        {isListening && (
                            <div className="flex justify-center">
                                <div className="px-4 py-2 rounded-full bg-primary/10 animate-pulse">
                                    <span className="text-primary text-base font-bold">
                                        Recording
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Error */}
                    {errorMessage && (
                        <div className="px-4 py-2 bg-red-50 border-t border-red-100 shrink-0">
                            <p className="text-red-700 text-xs font-bold text-center">{errorMessage}</p>
                        </div>
                    )}

                    {/* Suggestion rows — shown while the chat is empty */}
                    {messages.length === 0 && !isProcessing && (
                        <div className="px-3 pt-2 pb-1 bg-surface shrink-0 space-y-1.5">
                            {SUGGESTIONS.map((query) => (
                                <button
                                    key={query}
                                    onClick={() => sendTextQuery(query)}
                                    disabled={isListening}
                                    className="group w-full flex items-center justify-between gap-3 px-3.5 py-2 rounded-lg bg-background border border-border text-left text-text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="text-[13px] font-medium truncate">{query}</span>
                                    <svg
                                        className="w-3.5 h-3.5 shrink-0 text-text-muted group-hover:text-primary transition-colors"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <polyline points="9 10 4 15 9 20" />
                                        <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Footer: text input + send/mic */}
                    <div className="px-3 py-3 border-t border-border bg-surface shrink-0 flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type your query"
                            disabled={isListening || isProcessing}
                            className="flex-1 min-w-0 px-4 py-2 rounded-full bg-background border border-border text-text-primary text-base placeholder:text-text-muted focus:outline-none focus:border-primary/60 transition-colors disabled:opacity-50"
                        />

                        {hasText && !isListening && !isPlaying ? (
                            <button
                                onClick={handleSendText}
                                disabled={isProcessing}
                                className="w-10 h-10 shrink-0 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-all disabled:opacity-50"
                                title="Send"
                                aria-label="Send"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3.105 3.105a.75.75 0 01.841-.142l13.25 6.625a.75.75 0 010 1.343l-13.25 6.625a.75.75 0 01-1.03-.966L5.26 10 2.916 4.41a.75.75 0 01.19-1.305zM5.87 10.75l-1.77 4.216 10.07-5.035-10.07-5.035 1.77 4.216h4.88a.75.75 0 010 1.5H5.87z" />
                                </svg>
                            </button>
                        ) : (
                            <div className="relative flex items-center justify-center shrink-0" style={{ width: 40, height: 40 }}>
                                {isListening && (
                                    <LiveWaveform
                                        analyserRef={analyserRef}
                                        size={56}
                                        innerRadius={22}
                                        maxBarLength={10}
                                        barCount={24}
                                    />
                                )}
                                <button
                                    onClick={handleMicClick}
                                    disabled={isProcessing}
                                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all ${isListening
                                        ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                                        : isProcessing
                                            ? 'bg-background border-2 border-border border-dashed text-text-muted cursor-not-allowed'
                                            : isPlaying
                                                ? 'bg-primary text-white speaking-pulse'
                                                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-2 border-primary/20 hover:border-primary'
                                        }`}
                                    title={isListening ? 'Stop recording' : isPlaying ? 'Stop audio' : 'Record'}
                                    aria-label={isListening ? 'Stop recording' : isPlaying ? 'Stop audio' : 'Record'}
                                >
                                    {isProcessing ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                    ) : isListening ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <rect x="5" y="5" width="10" height="10" rx="1.5" />
                                        </svg>
                                    ) : isPlaying ? (
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                            <rect x="5" y="5" width="10" height="10" rx="1.5" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
