import React, { useEffect, useRef, useState } from 'react'

/**
 * Scroll-triggered fade-in wrapper. Add around any element that
 * should "reveal" as the user scrolls to it.
 *
 * <Reveal><SomeCard /></Reveal>
 *
 * Optional props:
 *   delay     — ms to stagger when revealing multiple siblings
 *   threshold — 0..1, how much of the element must be visible
 *   as        — wrapper element (default: div)
 */
export default function Reveal({ children, delay = 0, threshold = 0.12, as: Tag = 'div', className = '', ...rest }) {
    const ref = useRef(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        // IntersectionObserver support is ~100% modern — but guard anyway
        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true)
            return
        }

        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    obs.disconnect()
                }
            },
            { threshold }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [threshold])

    return (
        <Tag
            ref={ref}
            className={`reveal ${visible ? 'reveal-in' : ''} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
            {...rest}
        >
            {children}
        </Tag>
    )
}
