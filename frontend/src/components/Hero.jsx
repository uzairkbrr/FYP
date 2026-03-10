import React from 'react'

export default function Hero({ onStartQuery }) {
    return (
        <section className="relative overflow-hidden pt-32 pb-24 px-6 grid-bg">
            {/* Decorative background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[120px] -z-10" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-400/10 blur-[100px] -z-10" />

            <div className="max-w-4xl mx-auto text-center relative">
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

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                    <button
                        onClick={onStartQuery}
                        className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        </div>
                        Start Speaking Now
                    </button>
                </div>
            </div>
        </section>
    )
}
