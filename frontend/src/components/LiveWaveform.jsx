import React, { useEffect, useRef } from 'react'

export default function LiveWaveform({
    analyserRef,
    size = 192,
    innerRadius = 72,
    maxBarLength = 24,
    barCount = 40,
    color,
    className = '',
}) {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const dpr = window.devicePixelRatio || 1
        canvas.width = size * dpr
        canvas.height = size * dpr
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)

        // One smoothed amplitude per bar softens the motion so it doesn't jitter
        const smoothed = new Array(barCount).fill(0)
        let rafId = 0

        const cx = size / 2
        const cy = size / 2
        const BAR_WIDTH = 3
        const MIN_LEN = 4

        const draw = () => {
            ctx.clearRect(0, 0, size, size)

            const resolvedColor =
                color ||
                getComputedStyle(document.documentElement)
                    .getPropertyValue('--primary')
                    .trim() ||
                '#0099CC'

            const analyser = analyserRef?.current

            if (analyser) {
                const data = new Uint8Array(analyser.frequencyBinCount)
                analyser.getByteFrequencyData(data)

                // Focus on voice-range frequencies they live in the low-to-mid bins
                const usableBins = Math.floor(data.length * 0.65)

                for (let i = 0; i < barCount; i++) {
                    // Mirror the bins so left/right halves move symmetrically — looks organic
                    const half = Math.floor(barCount / 2)
                    const mirrored = i < half ? i : barCount - 1 - i
                    const binIdx = Math.floor((mirrored / half) * usableBins)
                    const raw = data[binIdx] / 255
                    smoothed[i] = smoothed[i] * 0.55 + raw * 0.45
                }
            } else {
                // Gracefully decay if analyser disappears mid-animation
                for (let i = 0; i < barCount; i++) smoothed[i] *= 0.85
            }

            ctx.lineCap = 'round'
            ctx.lineWidth = BAR_WIDTH
            ctx.strokeStyle = resolvedColor

            for (let i = 0; i < barCount; i++) {
                const amp = smoothed[i]
                const barLen = MIN_LEN + amp * maxBarLength
                // Start bars at top (-π/2) so the strongest hits show up at 12 o'clock
                const theta = (i / barCount) * Math.PI * 2 - Math.PI / 2

                const x1 = cx + Math.cos(theta) * innerRadius
                const y1 = cy + Math.sin(theta) * innerRadius
                const x2 = cx + Math.cos(theta) * (innerRadius + barLen)
                const y2 = cy + Math.sin(theta) * (innerRadius + barLen)

                ctx.globalAlpha = 0.35 + amp * 0.65
                ctx.beginPath()
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()
            }

            rafId = requestAnimationFrame(draw)
        }

        draw()
        return () => cancelAnimationFrame(rafId)
    }, [analyserRef, size, innerRadius, maxBarLength, barCount, color])

    return (
        <canvas
            ref={canvasRef}
            style={{
                width: size,
                height: size,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
            }}
            className={className}
            aria-hidden="true"
        />
    )
}
