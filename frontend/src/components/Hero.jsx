import React from 'react'

export default function Hero({ onStartQuery }) {
    return (
        <section
            className="relative overflow-hidden pt-32 pb-28 px-6"
            style={{
                backgroundImage: "url('/images/fast-building.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            {/* Dark overlay for readable foreground text */}
            <div
                className="absolute inset-0"
                style={{ background: 'rgba(0, 0, 0, 0.60)', zIndex: 0 }}
                aria-hidden="true"
            />

            <div className="max-w-4xl mx-auto text-center relative" style={{ zIndex: 1 }}>
                {/* Title — ~20% larger than before */}
                <h1 className="text-8xl sm:text-9xl font-black text-text-primary leading-[1] mb-8 tracking-tight font-serif italic">
                    Mahir on <span className="text-primary not-italic">Call</span>
                </h1>

                {/* Description */}
                <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed max-w-2xl mx-auto mb-12">
                    Every admission season, thousands of students call the same numbers, ask the same questions, and wait. Mahir answers instantly in Urdu any time of day.
                </p>

                {/* CTA */}
                <div className="flex items-center justify-center">
                    <button
                        onClick={onStartQuery}
                        className="inline-flex items-center px-9 py-4 rounded-2xl bg-primary text-white font-bold text-xl shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all duration-[250ms] hover:-translate-y-1 cursor-pointer"
                    >
                        Talk to Mahir
                    </button>
                </div>
            </div>
        </section>
    )
}
