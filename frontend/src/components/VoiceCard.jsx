import React, { useState } from 'react'

export default function VoiceCard() {
    const [status, setStatus] = useState('idle')
    const [messages, setMessages] = useState([])

    const handleStartListening = () => {
        setStatus('listening')
        // Simulate voice input detection
    }

    const handleStopListening = () => {
        setStatus('processing')

        // Mock processing delay and response
        setTimeout(() => {
            const mockTranscript = "FAST University ki tuition fees kitni hai?"
            const mockResponse = "FAST-NUCES ki tuition fee Rs. 11,000 per credit hour hai undergraduate programs ke liye."

            setMessages(prev => [
                ...prev,
                { role: 'user', text: mockTranscript },
                { role: 'bot', text: mockResponse }
            ])
            setStatus('responding')
        }, 1500)
    }

    const handleReset = () => {
        setStatus('idle')
        setMessages([])
    }

    const isListening = status === 'listening'
    const isProcessing = status === 'processing'
    const hasResponse = status === 'responding'

    return (
        <section id="voice-section" className="py-16 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm">
                    <div className="px-10 py-6 border-b border-border/20 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">Transcript</h3>

                        {hasResponse && (
                            <div className="flex items-center gap-3">
                                <button
                                    className="px-4 py-1.5 rounded-full bg-primary text-white text-[9px] font-bold uppercase tracking-widest hover:bg-primary-dark transition-all shadow-sm cursor-pointer"
                                >
                                    Listen
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="px-4 py-1.5 rounded-full bg-surface text-text-primary text-[9px] font-bold uppercase tracking-widest hover:bg-background transition-all border border-border cursor-pointer"
                                >
                                    New Query
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row px-8 pb-8 gap-8">
                        <div className="flex flex-col items-center justify-center md:w-[240px] shrink-0 pt-8">
                            <button
                                onClick={isListening ? handleStopListening : handleStartListening}
                                disabled={isProcessing}
                                className={`
                                    relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 border-2
                                    ${isListening
                                        ? 'bg-primary border-primary scale-105 shadow-2xl shadow-primary/20'
                                        : isProcessing
                                            ? 'bg-background/50 border-border border-dashed cursor-not-allowed'
                                            : 'bg-background border-border hover:border-primary/40 hover:bg-surface cursor-pointer text-text-primary'
                                    }
                                `}
                            >
                                {isProcessing ? (
                                    <svg className="w-12 h-12 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : isListening ? (
                                    <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                    </svg>
                                ) : (
                                    <svg className="w-12 h-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                )}
                            </button>
                            <div className="mt-8">
                                <button
                                    onClick={isListening ? handleStopListening : handleStartListening}
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 rounded-full bg-background border border-border text-[10px] font-bold text-text-secondary hover:bg-surface transition-colors cursor-pointer uppercase tracking-widest"
                                >
                                    {isListening ? 'Stop' : 'Click to Start'}
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col pt-8">
                            <div className="flex-1 min-h-[400px] flex flex-col bg-background/30 rounded-xl border border-border/40 p-6">
                                <div className="flex-1 overflow-y-auto space-y-4 scrollbar-thin pr-4">
                                    {messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full opacity-30 select-none text-center">
                                            <p className="text-text-muted text-xs font-medium italic tracking-wide">
                                                Go ahead, ask Mahir anything about the university...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((msg, i) => (
                                                <div key={i} className="group transition-all">
                                                    <div className="flex items-start gap-4">
                                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] mt-1 shrink-0 w-16 ${msg.role === 'user' ? 'text-text-muted' : 'text-primary'}`}>
                                                            {msg.role === 'user' ? 'You:' : 'Mahir:'}
                                                        </span>
                                                        <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                                                            {msg.text}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {status === 'error' && (
                                    <div className="mt-6 p-4 rounded bg-red-50 text-center border border-red-100">
                                        <p className="text-red-800 text-[10px] font-bold uppercase tracking-widest">
                                            Something went wrong. Please try again.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
