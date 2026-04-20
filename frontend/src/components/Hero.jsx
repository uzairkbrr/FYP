import React from 'react'

export default function Hero({ onStartQuery }) {
    return (
        <section className="relative overflow-hidden pt-32 pb-28 px-6 grid-bg">
            {/* Decorative gradient mesh */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/10 blur-[140px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-blue-400/10 blur-[120px] -z-10" />
            <div className="absolute top-32 -left-20 w-[360px] h-[360px] rounded-full bg-amber-200/10 blur-[110px] -z-10" />

            <div className="max-w-4xl mx-auto text-center relative">
                {/* Live status pill above the headline */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface border border-border mb-8">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-success opacity-75 animate-ping" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                    </span>
                    <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        Live — answering now
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-7xl sm:text-8xl font-black text-text-primary leading-[1] mb-8 tracking-tight font-serif italic">
                    Mahir on <span className="text-primary not-italic">Call</span>
                </h1>

                {/* Description */}
                <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-12">
                    Mahir on Call is an Urdu-based voice agent for FAST Peshawar.
                    Available 24/7 to solve your queries about admissions, fees, and more
                    with natural human-like responses.
                </p>

                {/* CTA */}
                <div className="flex items-center justify-center">
                    <button
                        onClick={onStartQuery}
                        className="inline-flex items-center px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all duration-[250ms] hover:-translate-y-1 cursor-pointer"
                    >
                        Talk to Mahir
                    </button>
                </div>

                {/* Trust stats */}
                <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[11px] font-bold text-text-muted uppercase tracking-[0.25em]">
                    <span className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        24/7 Available
                    </span>
                    <span className="hidden sm:inline text-border">•</span>
                    <span className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0a8.96 8.96 0 01-6-2.3M12 21a8.96 8.96 0 006-2.3M3 12h18M12 3c2.3 2.7 3.5 5.8 3.5 9s-1.2 6.3-3.5 9M12 3c-2.3 2.7-3.5 5.8-3.5 9s1.2 6.3 3.5 9" />
                        </svg>
                        Urdu + English
                    </span>
                    <span className="hidden sm:inline text-border">•</span>
                    <span className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h5" />
                        </svg>
                        Live Knowledge Base
                    </span>
                </div>

                {/* Scroll hint */}
                <div className="mt-16 flex justify-center opacity-60">
                    <div className="flex flex-col items-center gap-1 text-text-muted">
                        <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
                        <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    )
}
