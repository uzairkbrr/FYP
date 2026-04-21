import React, { useEffect, useState } from 'react'
import {
    ResponsiveContainer,
    BarChart, Bar,
    PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LabelList,
} from 'recharts'
import Navbar from '../components/Navbar'

/**
 * Test & Evaluation dashboard — rendered at /test-cases
 *
 * Data source: /test_results/evaluation.json  (static, committed to repo).
 * Re-run the test suites → regenerate that JSON → refresh this page.
 *
 * Expected schema:
 *   {
 *     summary:           { total_tests, passed, failed, pass_rate_pct, avg_p95_ms, sus_score },
 *     unit_integration:  [{ id, category, scenario, expected, actual, passed, duration_ms, notes? }],
 *     retrieval:         { dataset_size, k_values, precision_at_k, recall_at_k, hit_rate_at_k, mrr },
 *     scope_restriction: { dataset_size, correctly_refused, leaked, examples: [{prompt, refused, notes?}] },
 *     latency:           [{ endpoint, p50_ms, p95_ms, p99_ms, samples }],
 *     sus:               { score, n_respondents, interpretation, per_question_avg, quotes }
 *   }
 */

const COLOR_PRIMARY = '#9b2c2c'   // brand red
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
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-3">
                        Formal Testing
                    </p>
                    <h1 className="text-5xl font-black text-text-primary tracking-tight font-serif italic">
                        Testing &amp; <span className="text-primary not-italic">Evaluation</span>
                    </h1>
                    <p className="mt-4 text-text-secondary max-w-3xl leading-relaxed">
                        Results from unit, integration, retrieval, scope-restriction, latency and
                        user-acceptance testing for MahirConnect. Data is loaded from a static JSON
                        artifact produced by the test suites; re-running the suites updates every
                        chart on this page.
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
                        <SummaryStrip summary={data.summary} />
                        <UnitIntegrationSection rows={data.unit_integration} />
                        <RetrievalSection retrieval={data.retrieval} />
                        <ScopeSection scope={data.scope_restriction} />
                        <LatencySection latency={data.latency} />
                        <SusSection sus={data.sus} />
                    </div>
                )}
            </main>
        </div>
    )
}


// ─────────────────────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────────────────────

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

function Metric({ label, value, suffix = '', accent = false }) {
    return (
        <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm px-6 py-5">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2">{label}</p>
            <p className={`text-3xl font-black tracking-tight ${accent ? 'text-primary' : 'text-text-primary'}`}>
                {value}
                {suffix && <span className="text-lg text-text-muted font-bold ml-1">{suffix}</span>}
            </p>
        </div>
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

// Dark-themed tooltip for all Recharts components
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


// ─────────────────────────────────────────────────────────────────────────────
// 1. Summary strip
// ─────────────────────────────────────────────────────────────────────────────

function SummaryStrip({ summary }) {
    if (!summary) return null
    return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Metric label="Total Tests" value={summary.total_tests} />
            <Metric label="Passed" value={summary.passed} accent />
            <Metric label="Pass Rate" value={summary.pass_rate_pct.toFixed(1)} suffix="%" accent />
            <Metric label="Avg p95 Latency" value={summary.avg_p95_ms.toLocaleString()} suffix="ms" />
            <Metric label="SUS Score" value={summary.sus_score.toFixed(1)} accent />
        </div>
    )
}


// ─────────────────────────────────────────────────────────────────────────────
// 2. Unit + Integration
// ─────────────────────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────────────────────
// 3. RAG retrieval metrics
// ─────────────────────────────────────────────────────────────────────────────

function RetrievalSection({ retrieval }) {
    if (!retrieval) return null
    const chartData = retrieval.k_values.map((k, i) => ({
        k: `K=${k}`,
        Precision: +retrieval.precision_at_k[i].toFixed(3),
        Recall: +retrieval.recall_at_k[i].toFixed(3),
        'Hit Rate': +retrieval.hit_rate_at_k[i].toFixed(3),
    }))

    return (
        <Card
            title="RAG Retrieval Evaluation"
            subtitle={`Precision, Recall and Hit Rate at K, plus Mean Reciprocal Rank, computed on a labelled question-to-source dataset (n=${retrieval.dataset_size}).`}
        >
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8 items-center">
                <div className="h-72">
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                            <XAxis dataKey="k" stroke={AXIS_STROKE} tick={{ fontSize: 12 }} />
                            <YAxis stroke={AXIS_STROKE} domain={[0, 1]} tick={{ fontSize: 12 }} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(155,44,44,0.08)' }} />
                            <Legend wrapperStyle={{ fontSize: 12, color: '#c4c4c8' }} />
                            <Bar dataKey="Precision" fill={COLOR_PRIMARY} radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Recall" fill={COLOR_ACCENT} radius={[6, 6, 0, 0]} />
                            <Bar dataKey="Hit Rate" fill={COLOR_PURPLE} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                    <Metric label="MRR" value={retrieval.mrr.toFixed(3)} accent />
                    <Metric label="Dataset Size" value={retrieval.dataset_size} suffix="Q" />
                </div>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────────────────────
// 4. Scope restriction (off-topic refusal)
// ─────────────────────────────────────────────────────────────────────────────

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


// ─────────────────────────────────────────────────────────────────────────────
// 5. Latency
// ─────────────────────────────────────────────────────────────────────────────

function LatencySection({ latency }) {
    if (!latency) return null
    const chartData = latency.map((r) => ({
        endpoint: r.endpoint,
        p50: r.p50_ms,
        p95: r.p95_ms,
        p99: r.p99_ms,
    }))

    return (
        <Card
            title="Endpoint Latency"
            subtitle="p50 / p95 / p99 response time per endpoint, measured under local development conditions."
        >
            <div className="h-80">
                <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                        <XAxis dataKey="endpoint" stroke={AXIS_STROKE} tick={{ fontSize: 11 }} />
                        <YAxis stroke={AXIS_STROKE} tick={{ fontSize: 12 }} unit=" ms" />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(155,44,44,0.08)' }} />
                        <Legend wrapperStyle={{ fontSize: 12, color: '#c4c4c8' }} />
                        <Bar dataKey="p50" name="p50" fill={COLOR_ACCENT} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="p95" name="p95" fill={COLOR_PRIMARY} radius={[6, 6, 0, 0]} />
                        <Bar dataKey="p99" name="p99" fill={COLOR_AMBER} radius={[6, 6, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────────────────────
// 6. SUS (System Usability Scale)
// ─────────────────────────────────────────────────────────────────────────────

function SusSection({ sus }) {
    if (!sus) return null
    const chartData = sus.per_question_avg.map((p, i) => ({
        q: `Q${i + 1}`,
        avg: p.avg,
        full: p.q,
    }))

    return (
        <Card
            title="User Acceptance — SUS"
            subtitle={`Standardised usability questionnaire administered to ${sus.n_respondents} testers. ${sus.interpretation}`}
        >
            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
                <div>
                    <div className="rounded-xl border border-primary/30 bg-primary/10 p-8 text-center">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2">SUS Score</p>
                        <p className="text-6xl font-black text-primary tracking-tight">{sus.score.toFixed(1)}</p>
                        <p className="mt-2 text-xs text-text-secondary">out of 100 · n = {sus.n_respondents}</p>
                    </div>
                    <div className="mt-5 space-y-3">
                        {sus.quotes.map((q, i) => (
                            <blockquote
                                key={i}
                                className="text-xs text-text-secondary border-l-2 border-primary/40 pl-3 italic"
                            >
                                &ldquo;{q}&rdquo;
                            </blockquote>
                        ))}
                    </div>
                </div>

                <div>
                    <div className="h-80">
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                                <XAxis dataKey="q" stroke={AXIS_STROKE} tick={{ fontSize: 11 }} />
                                <YAxis stroke={AXIS_STROKE} domain={[0, 5]} tick={{ fontSize: 12 }} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null
                                        const row = payload[0].payload
                                        return (
                                            <div className="rounded-lg border border-border bg-surface/95 backdrop-blur px-3 py-2 text-xs shadow-xl max-w-xs">
                                                <p className="font-bold text-text-primary mb-1">{row.q}</p>
                                                <p className="text-text-secondary mb-1">{row.full}</p>
                                                <p className="text-primary font-bold">Avg: {row.avg}</p>
                                            </div>
                                        )
                                    }}
                                    cursor={{ fill: 'rgba(155,44,44,0.08)' }}
                                />
                                <Bar dataKey="avg" name="Average rating" fill={COLOR_PRIMARY} radius={[6, 6, 0, 0]}>
                                    <LabelList dataKey="avg" position="top" fill="#c4c4c8" fontSize={11} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="mt-2 text-[11px] text-text-muted italic">
                        Hover a bar to see the full question. Odd questions are positive phrasing (higher = better); even questions are negative phrasing (lower = better).
                    </p>
                </div>
            </div>
        </Card>
    )
}
