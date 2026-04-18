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

                {/* CTA — scrolls to the voice section */}
                <div className="flex items-center justify-center">
                    <button
                        onClick={onStartQuery}
                        className="inline-flex items-center px-8 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                    >
                        Talk to Mahir
                    </button>
                </div>
            </div>
        </section>
    )
}
