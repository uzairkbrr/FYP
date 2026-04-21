import React from 'react'

export default function Hero({ onStartQuery }) {
    return (
        <section className="relative overflow-hidden pt-32 pb-24 px-6">
            {/* Background image */}
            <div
                className="absolute inset-0 -z-20 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/fast-building.png')" }}
            />
            {/* Dark overlay for text contrast */}
            <div className="absolute inset-0 -z-10 bg-black/60" />

            <div className="max-w-[996px] mx-auto text-center relative">
                {/* Title */}
                <h1 className="text-7xl sm:text-8xl font-black text-white leading-[1] mb-8 tracking-tight font-serif italic drop-shadow-lg">
                    Mahir <span className="text-primary not-italic">Connect</span>
                </h1>

                {/* Description */}
                <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto mb-12 drop-shadow">
                    Every admission season, thousands of students call the same numbers,
                    ask the same questions, and wait. Mahir answers instantly in Urdu
                    any time of day.
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
