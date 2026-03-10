import React from 'react'

export default function Supervisor() {
    return (
        <section id="supervisor-section" className="py-24 px-6 bg-background relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary/5 blur-[100px] -z-10 rounded-full" />

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-black text-text-primary mb-4 tracking-tight font-serif italic">Supervisor</h2>
                </div>

                <div className="bg-surface rounded-xl border border-border/60 overflow-hidden max-w-5xl mx-auto min-h-[300px] flex flex-col md:flex-row transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
                    {/* Left – Info */}
                    <div className="flex-1 p-12 md:p-16 flex flex-col justify-center gap-4 relative overflow-hidden">
                        <div>
                            <h3 className="text-3xl font-black text-text-primary mb-1 tracking-tight font-serif uppercase">
                                Muhammad Umer Haroon
                            </h3>
                            <p className="text-text-muted font-bold text-sm uppercase tracking-widest">
                                Lecturer
                            </p>
                        </div>

                        <div>
                            <p className="text-text-muted font-bold text-xs uppercase tracking-widest mb-1">
                                Department of Computer Science
                            </p>
                            <p className="text-text-muted font-bold text-[10px] uppercase tracking-widest opacity-80">
                                National University of Computer and Emerging Sciences, Peshawar
                            </p>
                        </div>
                    </div>

                    {/* Right – Photo */}
                    <div className="md:w-[400px] w-full h-[400px] md:h-auto md:self-stretch shrink-0 overflow-hidden relative transition-all duration-700">
                        <img
                            src="/images/supervisor.png"
                            alt="Muhammad Umer Haroon"
                            className="w-full h-full object-cover transition-all duration-700 hover:scale-105"
                        />
                    </div>
                </div>
            </div>
        </section >
    )
}
