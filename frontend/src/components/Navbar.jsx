import React from 'react'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
    const { theme, toggleTheme } = useTheme();

    return (
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                {/* Brand */}
                <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-text-primary tracking-tight">
                        Mahir <span className="text-primary font-medium tracking-normal text-lg">on Call</span>
                    </span>
                </div>

                {/* Navigation Links & Actions */}
                <div className="flex items-center gap-8 ml-auto">
                    <div className="hidden md:flex items-center gap-8 mr-4">
                        <a href="#voice-section" className="text-sm font-bold text-text-secondary hover:text-primary transition-colors">Demo</a>
                        <a href="#mission-section" className="text-sm font-bold text-text-secondary hover:text-primary transition-colors">Mission</a>
                        <a href="#how-it-works" className="text-sm font-bold text-text-secondary hover:text-primary transition-colors">How it works</a>
                        <a href="#team-section" className="text-sm font-bold text-text-secondary hover:text-primary transition-colors">Team</a>
                        <a href="#supervisor-section" className="text-sm font-bold text-text-secondary hover:text-primary transition-colors">Supervisor</a>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 text-text-secondary hover:text-primary transition-all duration-300 cursor-pointer"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'light' ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    )
}
