import React from 'react'

/**
 * Mahir's visual persona — a glowing, breathing orb.
 *
 * Four layered elements make it feel organic and "alive":
 *   1. Outer glow     — large, blurred, pulses with the `state`
 *   2. Body           — radial gradient sphere with inner highlight
 *   3. Specular       — off-center bright spot to give it a 3D feel
 *   4. Aurora         — slow-rotating conic gradient, overlay-blended,
 *                       for subtle motion inside the sphere
 *
 * Props:
 *   size          — pixel size (width & height)
 *   state         — 'idle' | 'thinking' | 'speaking'
 *                   Controls the outer-glow animation speed/amplitude.
 *   onClick       — if provided, renders as a clickable button
 *   showMicIcon   — overlay a centered mic icon (used on the hero CTA)
 *   ariaLabel     — accessibility label when interactive
 */
export default function SpeakingOrb({
    size = 140,
    state = 'idle',
    onClick,
    showMicIcon = false,
    ariaLabel,
    className = '',
}) {
    const interactive = typeof onClick === 'function'
    const Tag = interactive ? 'button' : 'div'

    const glowAnim =
        state === 'speaking' ? 'orb-speaking'
        : state === 'thinking' ? 'orb-thinking'
        : 'orb-idle'

    return (
        <Tag
            onClick={onClick}
            aria-label={interactive ? (ariaLabel || 'Tap to speak') : undefined}
            className={`relative inline-block ${interactive ? 'cursor-pointer hover:scale-105 transition-transform duration-300' : ''} ${className}`}
            style={{
                width: size,
                height: size,
                border: 'none',
                padding: 0,
                background: 'transparent',
            }}
        >
            {/* 1. Outer glow — the breathing aura */}
            <div
                className={`absolute inset-0 rounded-full ${glowAnim}`}
                style={{
                    background: 'radial-gradient(circle, var(--primary) 0%, transparent 65%)',
                    filter: `blur(${Math.max(8, size * 0.14)}px)`,
                    opacity: 0.55,
                }}
            />

            {/* 2. Body — the orb itself */}
            <div
                className="absolute rounded-full"
                style={{
                    inset: '14%',
                    background: `radial-gradient(circle at 32% 28%,
                                    rgba(255, 200, 200, 0.95) 0%,
                                    var(--primary) 38%,
                                    var(--primary-dark) 100%)`,
                    boxShadow: `inset 0 0 ${size * 0.18}px rgba(255, 255, 255, 0.25),
                                0 0 ${size * 0.15}px var(--primary)`,
                }}
            />

            {/* 3. Specular highlight */}
            <div
                className="absolute rounded-full pointer-events-none"
                style={{
                    top: '20%',
                    left: '24%',
                    width: '30%',
                    height: '30%',
                    background: 'radial-gradient(circle, rgba(255, 255, 255, 0.6) 0%, transparent 70%)',
                    filter: `blur(${Math.max(4, size * 0.05)}px)`,
                }}
            />

            {/* 4. Slow-rotating aurora inside the sphere */}
            <div
                className="absolute rounded-full overflow-hidden orb-rotate pointer-events-none"
                style={{
                    inset: '14%',
                    background: `conic-gradient(from 0deg,
                                    transparent 0%,
                                    rgba(255, 255, 255, 0.35) 18%,
                                    transparent 40%,
                                    transparent 58%,
                                    rgba(255, 255, 255, 0.35) 78%,
                                    transparent 100%)`,
                    mixBlendMode: 'overlay',
                    opacity: 0.6,
                }}
            />

            {/* Optional centered mic icon (for CTA orbs) */}
            {showMicIcon && (
                <svg
                    className="absolute text-white pointer-events-none"
                    style={{
                        width: size * 0.3,
                        height: size * 0.3,
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.3))',
                    }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            )}
        </Tag>
    )
}
