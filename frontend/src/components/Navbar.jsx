import React from 'react'

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-text-primary tracking-tight">
                        Mahir <span className="text-primary font-medium tracking-normal text-xl">on Call</span>
                    </span>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-8 ml-auto">
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#voice-section" className="text-[15px] font-bold text-text-secondary hover:text-primary transition-colors">Demo</a>
                        <a href="#mission-section" className="text-[15px] font-bold text-text-secondary hover:text-primary transition-colors">Mission</a>
                        <a href="#team-section" className="text-[15px] font-bold text-text-secondary hover:text-primary transition-colors">Team</a>
                        <a href="#supervisor-section" className="text-[15px] font-bold text-text-secondary hover:text-primary transition-colors">Supervisor</a>
                    </div>
                </div>
            </div>
        </nav>
    )
}
