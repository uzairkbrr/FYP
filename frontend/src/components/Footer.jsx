import React from 'react'

const COLUMNS = [
    {
        title: 'Product',
        links: [
            { label: 'Voice Demo', href: '#voice-section' },
            { label: 'How it works', href: '#how-it-works' },
            { label: 'Test cases', href: '#test-cases-section' },
        ],
    },
    {
        title: 'Team',
        links: [
            { label: 'Contributors', href: '#team-section' },
            { label: 'Supervisor', href: '#supervisor-section' },
            { label: 'Mission', href: '#mission-section' },
        ],
    },
    {
        title: 'Contact',
        links: [
            { label: 'admissions@pwr.nu.edu.pk', href: 'mailto:admissions@pwr.nu.edu.pk' },
            { label: '(091) 111 128 128', href: 'tel:+92911111128128' },
            { label: 'FAST-NUCES Peshawar', href: 'https://pwr.nu.edu.pk', external: true },
        ],
    },
]

export default function Footer() {
    return (
        <footer className="border-t border-border bg-surface mt-12">
            <div className="max-w-7xl mx-auto px-6 py-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-14 mb-14">
                    {/* Brand column */}
                    <div className="col-span-2 md:col-span-1">
                        <div className="text-xl font-black text-text-primary tracking-tight font-serif italic">
                            Mahir <span className="text-primary not-italic font-medium text-lg tracking-normal">on Call</span>
                        </div>
                        <p className="mt-4 text-text-muted text-xs leading-relaxed max-w-[220px]">
                            Urdu-based voice agent for FAST Peshawar. Admissions, fees, scholarships — 24/7.
                        </p>
                    </div>

                    {COLUMNS.map((col) => (
                        <div key={col.title}>
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-5">
                                {col.title}
                            </h4>
                            <ul className="space-y-3">
                                {col.links.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            target={link.external ? '_blank' : undefined}
                                            rel={link.external ? 'noopener noreferrer' : undefined}
                                            className="text-sm text-text-secondary hover:text-primary transition-colors duration-[250ms]"
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p className="text-text-muted text-xs">
                        &copy; {new Date().getFullYear()} Mahir on Call — FAST-NUCES Peshawar
                    </p>
                    <p className="text-text-muted text-xs flex items-center gap-2 flex-wrap">
                        Press <span className="kbd">/</span> to open Mahir
                        <span className="text-border">•</span>
                        <span className="kbd">T</span> to toggle theme
                        <span className="text-border">•</span>
                        <span className="kbd">Esc</span> to close
                    </p>
                </div>
            </div>
        </footer>
    )
}
