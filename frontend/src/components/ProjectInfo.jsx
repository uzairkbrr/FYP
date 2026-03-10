import React from 'react'

export default function ProjectInfo() {
    return (
        <section id="project-section" className="py-24 px-6 bg-background">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-extrabold text-text-primary mb-4 tracking-tight">Understanding the Mission</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Problem Statement */}
                    <div className="group bg-surface rounded-xl p-12 border border-border/60 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="w-16 h-16 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                                <svg className="w-8 h-8 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-text-primary tracking-tight font-serif uppercase group-hover:text-primary transition-colors">The Challenge</h3>
                        </div>
                        <p className="text-text-secondary leading-relaxed font-medium text-base">
                            FAST University Peshawar's front desk faces a significant challenge in handling the
                            high volume of repetitive student queries regarding admissions, fee structures,
                            scholarships, and academic programs.
                        </p>
                    </div>

                    {/* Proposed Solution */}
                    <div className="group bg-surface rounded-xl p-12 border border-border/60 hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="flex items-center gap-6 mb-10">
                            <div className="w-16 h-16 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-black text-text-primary tracking-tight font-serif uppercase group-hover:text-success transition-colors">The Solution</h3>
                        </div>
                        <p className="text-text-secondary leading-relaxed font-medium text-base">
                            <strong>Mahir on Call</strong> scaleable Urdu-based voice agent for
                            seamless information retrieval. It utilizes speech-to-text
                            processing and semantic search to provide context-aware responses instantly.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}
