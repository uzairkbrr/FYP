import React, { useState, useRef, useEffect } from 'react'
import useVoiceRecorder from '../hooks/useVoiceRecorder'

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [showContact, setShowContact] = useState(false)
    const { status, messages, timer, errorMessage, audioUrl, startRecording, stopRecording, interruptAndRecord, reset } = useVoiceRecorder()
    const messagesEndRef = useRef(null)
    const audioRef = useRef(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, status])

    const isListening = status === 'listening'
    const isProcessing = status === 'processing'
    const isResponding = status === 'responding'

    const handleMicClick = () => {
        if (isListening) stopRecording()
        else if (isResponding) interruptAndRecord()
        else startRecording()
    }

    const handlePlayAudio = (url) => {
        if (url) {
            if (audioRef.current) audioRef.current.pause()
            audioRef.current = new Audio(url)
            audioRef.current.play().catch(() => { })
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        if (isListening) stopRecording()
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
    }

    const handleClearChat = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
        }
        reset()
    }

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
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] rounded-2xl bg-surface border border-border shadow-2xl flex flex-col overflow-hidden"
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
        >
            {/* ── Header ── */}
            <div className="px-4 py-3 bg-primary flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <h3 className="text-white font-bold text-sm tracking-wide">Mahir on Call</h3>
                </div>
                <div className="flex items-center gap-1">
                    {messages.length > 0 && (
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
                    <button
                        onClick={() => setShowContact(!showContact)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${showContact ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                        title="Contact Moderator"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    </button>
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

            {/* ── Contact Moderator ── */}
            {showContact && (
                <div className="px-4 py-2.5 border-b border-border bg-background/80 flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest mr-auto">Contact</span>
                    <a
                        href="mailto:admissions@pwr.nu.edu.pk"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-secondary text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                    </a>
                    <a
                        href="tel:+92911111128128"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-text-secondary text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Call
                    </a>
                </div>
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.length === 0 && status === 'idle' && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 select-none text-center px-6">
                        <svg className="w-12 h-12 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <p className="text-text-muted text-xs font-medium">
                            Tap the microphone to ask about admissions, fees, programs, and more.
                        </p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] px-4 py-2.5 text-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-primary text-white rounded-2xl rounded-br-sm'
                            : 'bg-background border border-border text-text-primary rounded-2xl rounded-bl-sm'
                            }`}>
                            <p>{msg.text}</p>
                            {msg.audioUrl && (
                                <button
                                    onClick={() => handlePlayAudio(msg.audioUrl)}
                                    className={`flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer ${msg.role === 'user' ? 'text-white/70 hover:text-white' : 'text-primary/70 hover:text-primary'
                                        } transition-colors`}
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    </svg>
                                    Play Audio
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isListening && (
                    <div className="flex justify-center">
                        <div className="px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-bold animate-pulse">
                            Recording {timer}s / {MAX_SECONDS}s
                        </div>
                    </div>
                )}

                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-background border border-border rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-xs text-text-muted font-medium">Processing</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Error ── */}
            {errorMessage && (
                <div className="px-4 py-2 bg-red-50 border-t border-red-100 shrink-0">
                    <p className="text-red-700 text-[10px] font-bold text-center">{errorMessage}</p>
                </div>
            )}

            {/* ── Footer ── */}
            <div className="px-4 py-3 border-t border-border bg-surface shrink-0 flex items-center justify-center gap-4">
                <button
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${isListening
                        ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                        : isProcessing
                            ? 'bg-background/50 border-2 border-border border-dashed cursor-not-allowed text-text-muted'
                            : isResponding
                                ? 'bg-primary text-white speaking-pulse'
                                : 'bg-primary/10 text-primary hover:bg-primary hover:text-white border-2 border-primary/20 hover:border-primary'
                        }`}
                >
                    {isProcessing ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : isListening ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                    {isListening && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    )}
                </button>

                <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    {isListening ? `${timer}s` : isProcessing ? 'Wait' : isResponding ? 'Tap to interrupt' : 'Tap to speak'}
                </span>
            </div>
        </div>
    )
}

const MAX_SECONDS = 30
