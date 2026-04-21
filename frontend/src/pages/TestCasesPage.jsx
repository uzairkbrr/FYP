import React, { useEffect, useState } from 'react'
import {
    ResponsiveContainer,
    PieChart, Pie, Cell,
    Tooltip,
} from 'recharts'
import Navbar from '../components/Navbar'

const COLOR_PRIMARY = '#0099CC'   // brand teal
const COLOR_SUCCESS = '#22c55e'   // green
const COLOR_DANGER = '#ef4444'    // red
const COLOR_ACCENT = '#60a5fa'    // blue
const COLOR_PURPLE = '#a855f7'
const COLOR_AMBER = '#f59e0b'
const GRID_STROKE = '#2a2a2f'
const AXIS_STROKE = '#8a8a90'

export default function TestCasesPage() {
    const [data, setData] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        fetch('/test_results/evaluation.json')
            .then((r) => {
                if (!r.ok) throw new Error('failed')
                return r.json()
            })
            .then(setData)
            .catch(() => setError('Please try again.'))
    }, [])

    return (
        <div className="min-h-screen font-sans">
            <Navbar />
            <main className="max-w-[1380px] mx-auto px-6 py-16">
                <header className="mb-12">
                    <h1 className="text-5xl font-black text-text-primary tracking-tight font-serif italic">
                        Testing &amp; <span className="text-primary not-italic">Evaluation</span>
                    </h1>
                    <p className="mt-4 text-text-secondary max-w-3xl leading-relaxed">
                        Test results for MahirConnect: covering accuracy, response quality, speed, and user satisfaction.
                    </p>
                </header>

                {error && (
                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {!data && !error && <LoadingBlock />}

                {data && (
                    <div className="space-y-10">
                        <ResponseTimeBanner responseTime={data.response_time} />
                        <UnitIntegrationSection rows={data.unit_integration} />
                        <ScopeSection scope={data.scope_restriction} />
                    </div>
                )}
            </main>
        </div>
    )
}


function Card({ title, subtitle, children, className = '' }) {
    return (
        <section className={`rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm ${className}`}>
            {(title || subtitle) && (
                <div className="px-8 py-5 border-b border-border/20">
                    {title && (
                        <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                            {title}
                        </h3>
                    )}
                    {subtitle && (
                        <p className="mt-2 text-text-secondary text-sm">{subtitle}</p>
                    )}
                </div>
            )}
            <div className="px-8 py-6">{children}</div>
        </section>
    )
}

function LoadingBlock() {
    return (
        <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm p-10 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary animate-spin mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-text-muted text-sm">Loading evaluation results</span>
        </div>
    )
}

function ResponseTimeBanner({ responseTime }) {
    if (!responseTime) return null
    const { avg_seconds, samples, description } = responseTime
    return (
        <section className="rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-stretch">
                <div className="shrink-0 flex items-center justify-center px-10 py-8 bg-primary/15 border-b md:border-b-0 md:border-r border-primary/20">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2">Avg. Response Time</p>
                        <p className="text-6xl font-black text-primary tracking-tight leading-none">~{avg_seconds}<span className="text-3xl font-bold ml-1">s</span></p>
                        {samples ? (
                            <p className="mt-2 text-[11px] text-text-muted uppercase tracking-widest">n = {samples} queries</p>
                        ) : null}
                    </div>
                </div>
                <div className="flex-1 px-8 py-6 flex flex-col justify-center">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-2">End-to-End Latency</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {description}
                    </p>
                </div>
            </div>
        </section>
    )
}

function ChartTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null
    return (
        <div className="rounded-lg border border-border bg-surface/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
            {label && <p className="font-bold text-text-primary mb-1">{label}</p>}
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color || p.fill }}>
                    <span className="text-text-muted">{p.name}: </span>
                    <span className="font-bold">{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</span>
                </p>
            ))}
        </div>
    )
}


function UnitIntegrationSection({ rows }) {
    const [filter, setFilter] = useState('all') // all | Unit | Integration | failed
    if (!rows) return null

    const filtered = rows.filter((r) => {
        if (filter === 'all') return true
        if (filter === 'failed') return !r.passed
        return r.category === filter
    })

    const passed = rows.filter((r) => r.passed).length
    const failed = rows.length - passed
    const pie = [
        { name: 'Passed', value: passed, color: COLOR_SUCCESS },
        { name: 'Failed', value: failed, color: COLOR_DANGER },
    ]

    return (
        <Card
            title="Unit & Integration Tests"
            subtitle="Per-stage function tests and FastAPI endpoint integration checks run via pytest."
        >
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
                <div>
                    <div className="h-56">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pie}
                                    dataKey="value"
                                    nameKey="name"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {pie.map((entry) => (
                                        <Cell key={entry.name} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 flex items-center justify-center gap-5 text-xs">
                        <LegendSwatch color={COLOR_SUCCESS} label={`Passed · ${passed}`} />
                        <LegendSwatch color={COLOR_DANGER} label={`Failed · ${failed}`} />
                    </div>
                </div>

                <div>
                    <div className="flex items-center gap-2 mb-4">
                        {['all', 'Unit', 'Integration', 'failed'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${filter === f
                                    ? 'bg-primary text-white border border-primary'
                                    : 'bg-surface border border-border text-text-secondary hover:border-primary/40 hover:text-primary'
                                    }`}
                            >
                                {f === 'all' ? 'All' : f === 'failed' ? 'Failed only' : f}
                            </button>
                        ))}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border/40">
                                    <Th>ID</Th>
                                    <Th>Category</Th>
                                    <Th>Scenario</Th>
                                    <Th>Expected → Actual</Th>
                                    <Th className="w-[60px]">ms</Th>
                                    <Th className="w-[90px]">Result</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((r) => (
                                    <tr key={r.id} className="border-b border-border/20 align-top">
                                        <Td mono>{r.id}</Td>
                                        <Td>{r.category}</Td>
                                        <Td>
                                            <div className="text-text-primary text-xs">{r.scenario}</div>
                                            {r.notes && (
                                                <div className="text-text-muted text-[11px] mt-1 italic">{r.notes}</div>
                                            )}
                                        </Td>
                                        <Td>
                                            <div className="text-[11px] text-text-muted">
                                                <span className="block">Expected: <span className="text-text-secondary">{r.expected}</span></span>
                                                <span className="block">Actual: <span className="text-text-secondary">{r.actual}</span></span>
                                            </div>
                                        </Td>
                                        <Td>{r.duration_ms}</Td>
                                        <Td>
                                            {r.passed ? (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-500/15 text-green-500 border border-green-500/40">
                                                    Pass
                                                </span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/40">
                                                    Fail
                                                </span>
                                            )}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Card>
    )
}

function Th({ children, className = '' }) {
    return (
        <th className={`text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest ${className}`}>
            {children}
        </th>
    )
}

function Td({ children, mono = false }) {
    return (
        <td className={`py-3 pr-4 text-xs text-text-secondary ${mono ? 'font-mono text-text-primary' : ''}`}>
            {children}
        </td>
    )
}

function LegendSwatch({ color, label }) {
    return (
        <span className="inline-flex items-center gap-2 text-text-secondary">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            {label}
        </span>
    )
}


function ScopeSection({ scope }) {
    if (!scope) return null
    const refusedPct = (scope.correctly_refused / scope.dataset_size) * 100
    const pie = [
        { name: 'Correctly Refused', value: scope.correctly_refused, color: COLOR_SUCCESS },
        { name: 'Leaked (answered)', value: scope.leaked, color: COLOR_DANGER },
    ]

    return (
        <Card
            title="Scope Restriction (Off-Topic Refusal)"
            subtitle={`${scope.dataset_size} off-topic prompts sent; the system must return the canonical refusal and not use retrieved context.`}
        >
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
                <div>
                    <div className="h-56">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
                                    {pie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                                </Pie>
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-2 text-center">
                        <p className="text-3xl font-black text-primary">{refusedPct.toFixed(1)}%</p>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em]">refusal accuracy</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/40">
                                <Th>Prompt</Th>
                                <Th className="w-[110px]">Outcome</Th>
                                <Th>Notes</Th>
                            </tr>
                        </thead>
                        <tbody>
                            {scope.examples.map((ex, i) => (
                                <tr key={i} className="border-b border-border/20 align-top">
                                    <Td>{ex.prompt}</Td>
                                    <Td>
                                        {ex.refused ? (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-500/15 text-green-500 border border-green-500/40">
                                                Refused
                                            </span>
                                        ) : (
                                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-red-500/15 text-red-400 border border-red-500/40">
                                                Leaked
                                            </span>
                                        )}
                                    </Td>
                                    <Td>{ex.notes || '—'}</Td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    )
}


