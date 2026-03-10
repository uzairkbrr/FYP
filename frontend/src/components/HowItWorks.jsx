import React from 'react'

export default function HowItWorks() {
    const steps = [
        {
            title: "User Speaks",
            tech: "Web Audio API",
            desc: "Voice input is captured directly from the microphone securely over the browser.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            )
        },
        {
            title: "Speech",
            tech: "Audio Handling",
            desc: "The verbal query is packaged into a compressed audio clip sent to the backend.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            )
        },
        {
            title: "Speech To Text",
            tech: "STT Engine",
            desc: "The phonetic audio is transcribed with high accuracy into a readable string.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
            )
        },
        {
            title: "Urdu Text",
            tech: "Roman-Urdu",
            desc: "Transcribed text is mapped into the standard phonetic alphabet for processing.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            title: "Generation",
            tech: "RAG System",
            desc: "Retrieval-Augmented Generation parses university logic to form a pristine answer.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
            )
        },
        {
            title: "Urdu Text",
            tech: "Urdu Script",
            desc: "The factual response is formatted back into native Urdu language structure.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )
        },
        {
            title: "TTS Model",
            tech: "Voice Synthesis",
            desc: "The text buffer is ingested to computationally generate natural human speech.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
            )
        },
        {
            title: "Speech / Voice",
            tech: "Audio Payload",
            desc: "The final synthesized artificial voice file is played aloud cleanly.",
            icon: (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        }
    ];

    return (
        <section id="how-it-works" className="py-24 px-6 bg-background relative overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-text-primary mb-4 tracking-tight font-serif italic">What drives <span className="text-primary not-italic">Mahir?</span></h2>
                    <p className="text-text-muted max-w-2xl mx-auto font-medium uppercase text-[10px] tracking-[0.3em]">
                        Technical Stack & Optimization
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-12 gap-x-6 lg:gap-x-10">
                    {steps.map((step, index) => (
                        <div key={index} className="flex flex-col items-center relative w-full">
                            <div className="group flex flex-col items-center justify-start w-full max-w-[260px] bg-white border border-border/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-xl px-4 pt-8 pb-5 text-center transition-all duration-300 hover:border-primary/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-2 relative h-64 overflow-hidden z-10">
                                {/* Number Badge */}
                                <div className="absolute top-0 right-0 w-8 h-8 rounded-bl-xl bg-primary/10 text-primary font-bold flex items-center justify-center border-l border-b border-primary/20 text-xs shadow-sm bg-gradient-to-br from-blue-50 to-primary/20">
                                    0{index + 1}
                                </div>

                                {/* Icon */}
                                <div className="w-12 h-12 rounded-lg bg-blue-50/50 border border-blue-100/50 text-primary flex items-center justify-center mb-4 mt-2 group-hover:bg-primary group-hover:text-white transition-all duration-300 shrink-0 shadow-sm relative z-10">
                                    {step.icon}
                                </div>

                                {/* Content */}
                                <h3 className="text-sm font-bold text-gray-900 tracking-tight mb-3 leading-tight relative z-10">
                                    {step.title}
                                </h3>

                                {/* Description */}
                                <p className="text-[12px] text-gray-500 font-normal leading-relaxed mb-4 flex-grow px-2 relative z-10">
                                    {step.desc}
                                </p>

                                {/* Tech Label */}
                                <div className="mt-auto w-full relative z-10">
                                    <p className="text-[11px] text-gray-500 font-semibold px-2 py-1.5 bg-gray-50 rounded w-full border border-gray-100 break-words group-hover:bg-primary/5 group-hover:text-primary transition-all shadow-inner">
                                        {step.tech}
                                    </p>
                                </div>

                                {/* Hover background effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl z-0" />
                            </div>

                            {/* Arrow Indicator (Show on all but last in row) */}
                            {/* We don't want an arrow pointing right if it's the 4th item visually dropping to the next line */}
                            {index < steps.length - 1 && (index + 1) % 4 !== 0 && (
                                <div className="hidden lg:flex absolute top-1/2 -right-5 transform -translate-y-1/2 z-0">
                                    <svg className="w-10 h-10 text-white opacity-80 animate-pulse drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            )}

                            {/* Mobile/Tablet Down Arrow */}
                            {index < steps.length - 1 && (
                                <div className="block lg:hidden py-3 w-full flex justify-center z-0">
                                    <svg className="w-8 h-8 text-white opacity-80 animate-bounce drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
