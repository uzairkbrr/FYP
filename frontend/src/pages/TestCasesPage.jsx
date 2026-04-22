import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

/**
 * Test & Evaluation dashboard at /test-cases.
 *
 * Reads /test_results/evaluation.json (written by run_tests.py).
 * Every section handles a `result: null` state (shows "Pending" until a run populates it).
 */

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
            <TestCasesNavbar />
            <main className="max-w-[1380px] mx-auto px-6 py-16">
                <header className="mb-12">
                    <h1 className="text-5xl font-black text-text-primary tracking-tight font-serif italic">
                        Testing &amp; <span className="text-primary not-italic">Evaluation</span>
                    </h1>
                    <p className="mt-4 text-text-secondary max-w-3xl leading-relaxed">
                        Test results for MahirConnect: covering accuracy, response quality, speed, and robustness.
                    </p>
                    {data?.last_run && (
                        <p className="mt-2 text-xs text-text-muted">
                            Last run: {new Date(data.last_run).toLocaleString()}
                        </p>
                    )}
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
                        <UnitIntegrationSection section={data.unit_integration} />
                        <TransliterationSection section={data.transliteration_accuracy} />
                        <AnswerAccuracySection section={data.answer_accuracy} />
                        <ScopeSection section={data.scope_restriction} />
                        <EdgeCasesSection section={data.edge_cases} />
                        <SecuritySection section={data.security_validation} />
                        <BenchmarkQueriesSection section={data.benchmark_queries} />
                        <UserAcceptanceSection section={data.user_acceptance} />
                    </div>
                )}
            </main>
        </div>
    )
}


function TestCasesNavbar() {
    return (
        <nav className="sticky top-0 z-40 bg-[#121F27] backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-[1380px] mx-auto px-6 py-4 flex items-center justify-between">
                <Link to="/test-cases" className="text-xl font-extrabold text-white tracking-tight">
                    Mahir<span className="text-primary">Connect</span>
                </Link>
                <div className="flex items-center gap-8">
                    <Link to="/" className="text-sm font-bold text-white hover:text-primary transition-colors">Home</Link>
                    <a href="#overview" className="text-sm font-bold text-white hover:text-primary transition-colors">Overview</a>
                    <a href="#unit-tests" className="text-sm font-bold text-white hover:text-primary transition-colors">Unit Tests</a>
                    <a href="#answer-accuracy" className="text-sm font-bold text-white hover:text-primary transition-colors">Accuracy</a>
                    <a href="#scope-restriction" className="text-sm font-bold text-white hover:text-primary transition-colors">Scope</a>
                </div>
            </div>
        </nav>
    )
}


// ─────────────────────────────────────────────────────────────
// Shared UI
// ─────────────────────────────────────────────────────────────

function Card({ id, title, subtitle, children, className = '' }) {
    return (
        <section id={id} className={`rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm ${className}`}>
            {(title || subtitle) && (
                <div className="px-8 py-5 border-b border-border/20 flex items-start justify-between gap-4">
                    <div>
                        {title && (
                            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="mt-2 text-text-secondary text-sm">{subtitle}</p>
                        )}
                    </div>
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

function Th({ children, className = '' }) {
    return (
        <th className={`text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest ${className}`}>
            {children}
        </th>
    )
}

function Td({ children, mono = false, className = '' }) {
    return (
        <td className={`py-3 pr-4 text-xs text-text-secondary align-top ${mono ? 'font-mono text-text-primary' : ''} ${className}`}>
            {children}
        </td>
    )
}

// A compact pass/fail/skip/pending pill derived from case.result
function StatusBadge({ result, successLabel = 'Pass', failLabel = 'Fail' }) {
    let label = 'Pending'
    let cls = 'bg-text-muted/15 text-text-muted border-text-muted/30'
    if (result) {
        if (result.skipped || result.passed === null) {
            label = 'Skip'
            cls = 'bg-yellow-500/15 text-yellow-500 border-yellow-500/40'
        } else if (result.passed === true) {
            label = successLabel
            cls = 'bg-green-500/15 text-green-500 border-green-500/40'
        } else if (result.passed === false) {
            label = failLabel
            cls = 'bg-red-500/15 text-red-400 border-red-500/40'
        }
    }
    return (
        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${cls}`}>
            {label}
        </span>
    )
}

// Compute { passed, failed, skipped, pending, total } from an array of cases
function tallyCases(cases = []) {
    const total = cases.length
    let passed = 0, failed = 0, skipped = 0, pending = 0
    for (const c of cases) {
        if (!c.result) pending++
        else if (c.result.skipped || c.result.passed === null) skipped++
        else if (c.result.passed === true) passed++
        else failed++
    }
    return { total, passed, failed, skipped, pending }
}

function CountChip({ label, value, tone = 'neutral' }) {
    const tones = {
        neutral: 'bg-text-muted/10 text-text-muted border-text-muted/30',
        good:    'bg-green-500/15 text-green-500 border-green-500/40',
        bad:     'bg-red-500/15 text-red-400 border-red-500/40',
        warn:    'bg-yellow-500/15 text-yellow-500 border-yellow-500/40',
        accent:  'bg-primary/10 text-primary border-primary/30',
    }
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${tones[tone]}`}>
            <span className="text-sm font-black">{value}</span>
            <span>{label}</span>
        </span>
    )
}

function SectionStats({ cases }) {
    const t = tallyCases(cases)
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <CountChip label="total" value={t.total} />
            <CountChip label="passed" value={t.passed} tone="good" />
            {t.failed  > 0 && <CountChip label="failed"  value={t.failed}  tone="bad" />}
            {t.skipped > 0 && <CountChip label="skipped" value={t.skipped} tone="warn" />}
            {t.pending > 0 && <CountChip label="pending" value={t.pending} tone="neutral" />}
        </div>
    )
}


// ─────────────────────────────────────────────────────────────
// 1. Response Time (overview banner)
// ─────────────────────────────────────────────────────────────

function ResponseTimeBanner({ responseTime }) {
    if (!responseTime) return null
    const r = responseTime.result
    const hasResult = r && typeof r.avg_seconds === 'number'

    return (
        <section id="overview" className="rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-sm shadow-sm overflow-hidden">
            <div className="flex flex-col md:flex-row items-stretch">
                <div className="shrink-0 flex items-center justify-center px-10 py-8 bg-primary/15 border-b md:border-b-0 md:border-r border-primary/20">
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-2">Avg. Response Time</p>
                        {hasResult ? (
                            <>
                                <p className="text-6xl font-black text-primary tracking-tight leading-none">
                                    ~{r.avg_seconds}<span className="text-3xl font-bold ml-1">s</span>
                                </p>
                                <p className="mt-2 text-[11px] text-text-muted uppercase tracking-widest">
                                    n = {r.samples ?? 0} queries
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="text-5xl font-black text-text-muted tracking-tight leading-none">—</p>
                                <p className="mt-2 text-[11px] text-text-muted uppercase tracking-widest">Pending</p>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex-1 px-8 py-6 flex flex-col justify-center">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em] mb-2">End-to-End Latency</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                        {responseTime.description}
                    </p>
                    {hasResult && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <CountChip label="p50" value={`${r.p50_seconds ?? '—'}s`} tone="accent" />
                            <CountChip label="p95" value={`${r.p95_seconds ?? '—'}s`} tone="accent" />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}


// ─────────────────────────────────────────────────────────────
// 2. Unit & Integration
// ─────────────────────────────────────────────────────────────

function UnitIntegrationSection({ section }) {
    const [filter, setFilter] = useState('all')
    if (!section?.cases) return null

    const filtered = section.cases.filter((c) => {
        if (filter === 'all') return true
        if (filter === 'failed') return c.result && c.result.passed === false
        return c.category === filter
    })

    return (
        <Card id="unit-tests" title="Unit & Integration Tests" subtitle={section.description}>
            <SectionStats cases={section.cases} />
            <div className="flex items-center gap-2 mb-4 flex-wrap">
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
                            <Th className="w-[70px]">ms</Th>
                            <Th className="w-[90px]">Result</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c) => (
                            <tr key={c.id} className="border-b border-border/20">
                                <Td mono>{c.id}</Td>
                                <Td>{c.category}</Td>
                                <Td>
                                    <div className="text-text-primary text-xs">{c.scenario}</div>
                                    {c.input && (
                                        <div className="text-text-muted text-[11px] mt-1 font-mono">
                                            input: {c.input}
                                        </div>
                                    )}
                                </Td>
                                <Td>
                                    <div className="text-[11px] text-text-muted">
                                        <span className="block">Expected: <span className="text-text-secondary">{c.expected}</span></span>
                                        <span className="block">Actual: <span className="text-text-secondary">{c.result?.actual ?? '—'}</span></span>
                                    </div>
                                </Td>
                                <Td>{c.result?.duration_ms ?? '—'}</Td>
                                <Td><StatusBadge result={c.result} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 3. Transliteration Accuracy
// ─────────────────────────────────────────────────────────────

function TransliterationSection({ section }) {
    if (!section?.cases) return null
    return (
        <Card id="transliteration" title="Transliteration Accuracy" subtitle={section.description}>
            <SectionStats cases={section.cases} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40">
                            <Th className="w-[60px]">ID</Th>
                            <Th>Urdu</Th>
                            <Th>Expected</Th>
                            <Th>Actual</Th>
                            <Th className="w-[90px]">Result</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.cases.map((c) => (
                            <tr key={c.id} className="border-b border-border/20">
                                <Td mono>{c.id}</Td>
                                <Td className="text-right" >
                                    <span className="text-text-primary" dir="rtl">{c.urdu}</span>
                                </Td>
                                <Td>{c.expected}</Td>
                                <Td><span className="text-text-primary">{c.result?.actual ?? '—'}</span></Td>
                                <Td><StatusBadge result={c.result} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 4. Answer Accuracy
// ─────────────────────────────────────────────────────────────

function AnswerAccuracySection({ section }) {
    if (!section?.cases) return null
    return (
        <Card id="answer-accuracy" title="Answer Accuracy" subtitle={section.description}>
            <SectionStats cases={section.cases} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40">
                            <Th className="w-[60px]">ID</Th>
                            <Th className="w-[160px]">Category</Th>
                            <Th>Query</Th>
                            <Th>Expected Keywords</Th>
                            <Th>Matched</Th>
                            <Th className="w-[90px]">Result</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.cases.map((c) => (
                            <tr key={c.id} className="border-b border-border/20">
                                <Td mono>{c.id}</Td>
                                <Td>{c.category}</Td>
                                <Td><span className="text-text-primary">{c.query}</span></Td>
                                <Td>
                                    <div className="flex flex-wrap gap-1">
                                        {(c.expected_contains || []).map((kw, i) => (
                                            <span key={i} className="inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-background border border-border text-text-muted">
                                                {kw}
                                            </span>
                                        ))}
                                    </div>
                                </Td>
                                <Td>
                                    <div className="flex flex-wrap gap-1">
                                        {(c.result?.matched_keywords || []).map((kw, i) => (
                                            <span key={i} className="inline-block px-1.5 py-0.5 rounded-full text-[10px] bg-green-500/10 border border-green-500/30 text-green-500">
                                                {kw}
                                            </span>
                                        ))}
                                        {!c.result && <span className="text-text-muted">—</span>}
                                    </div>
                                </Td>
                                <Td><StatusBadge result={c.result} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 5. Scope Restriction
// ─────────────────────────────────────────────────────────────

function ScopeSection({ section }) {
    const [filter, setFilter] = useState('all')
    if (!section?.cases) return null

    const filtered = section.cases.filter((c) => {
        if (filter === 'all') return true
        if (filter === 'leaked') return c.result && c.result.refused === false && c.result.passed === false
        return c.language === filter
    })

    return (
        <Card id="scope-restriction" title="Off-Topic Refusal" subtitle={section.description}>
            <SectionStats cases={section.cases} />
            <div className="flex items-center gap-2 mb-4 flex-wrap">
                {[
                    { k: 'all',        label: 'All' },
                    { k: 'roman-urdu', label: 'Roman-Urdu' },
                    { k: 'english',    label: 'English' },
                    { k: 'leaked',     label: 'Leaked only' },
                ].map(({ k, label }) => (
                    <button
                        key={k}
                        onClick={() => setFilter(k)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${filter === k
                            ? 'bg-primary text-white border border-primary'
                            : 'bg-surface border border-border text-text-secondary hover:border-primary/40 hover:text-primary'
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40">
                            <Th className="w-[60px]">ID</Th>
                            <Th className="w-[110px]">Language</Th>
                            <Th>Prompt</Th>
                            <Th>Response snippet</Th>
                            <Th className="w-[110px]">Outcome</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((c) => (
                            <tr key={c.id} className="border-b border-border/20">
                                <Td mono>{c.id}</Td>
                                <Td>{c.language}</Td>
                                <Td><span className="text-text-primary">{c.prompt}</span></Td>
                                <Td>{c.result?.response_snippet ?? '—'}</Td>
                                <Td><StatusBadge result={c.result} successLabel="Refused" failLabel="Leaked" /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 6. Edge Cases
// ─────────────────────────────────────────────────────────────

function EdgeCasesSection({ section }) {
    if (!section?.cases) return null
    return (
        <Card id="edge-cases" title="Edge Cases" subtitle={section.description}>
            <SectionStats cases={section.cases} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40">
                            <Th className="w-[60px]">ID</Th>
                            <Th>Scenario</Th>
                            <Th>Expected</Th>
                            <Th>Actual</Th>
                            <Th className="w-[90px]">Result</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.cases.map((c) => (
                            <tr key={c.id} className="border-b border-border/20">
                                <Td mono>{c.id}</Td>
                                <Td><span className="text-text-primary">{c.scenario}</span></Td>
                                <Td>{c.expected}</Td>
                                <Td>{c.result?.actual ?? '—'}</Td>
                                <Td><StatusBadge result={c.result} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 7. Security & Validation
// ─────────────────────────────────────────────────────────────

function SecuritySection({ section }) {
    if (!section?.cases) return null
    return (
        <Card id="security" title="Security & Validation" subtitle={section.description}>
            <SectionStats cases={section.cases} />
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40">
                            <Th className="w-[60px]">ID</Th>
                            <Th>Check</Th>
                            <Th className="w-[180px]">Expected</Th>
                            <Th className="w-[180px]">Actual</Th>
                            <Th className="w-[90px]">Result</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.cases.map((c) => (
                            <tr key={c.id} className="border-b border-border/20">
                                <Td mono>{c.id}</Td>
                                <Td><span className="text-text-primary">{c.check}</span></Td>
                                <Td>{c.expected}</Td>
                                <Td>{c.result?.actual ?? '—'}</Td>
                                <Td><StatusBadge result={c.result} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 8. Benchmark Queries (the shared set used by the runner)
// ─────────────────────────────────────────────────────────────

function BenchmarkQueriesSection({ section }) {
    if (!section?.queries) return null
    return (
        <Card id="benchmark-queries" title="Benchmark Queries" subtitle={section.description}>
            <div className="flex flex-wrap items-center gap-2 mb-4">
                <CountChip label="queries" value={section.queries.length} tone="accent" />
                <CountChip label="roman-urdu" value={section.queries.filter((q) => q.language === 'roman-urdu').length} />
                <CountChip label="english" value={section.queries.filter((q) => q.language === 'english').length} />
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border/40">
                            <Th className="w-[60px]">ID</Th>
                            <Th className="w-[180px]">Category</Th>
                            <Th className="w-[110px]">Language</Th>
                            <Th>Query</Th>
                        </tr>
                    </thead>
                    <tbody>
                        {section.queries.map((q) => (
                            <tr key={q.id} className="border-b border-border/20">
                                <Td mono>{q.id}</Td>
                                <Td>{q.category}</Td>
                                <Td>{q.language}</Td>
                                <Td><span className="text-text-primary">{q.query}</span></Td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    )
}


// ─────────────────────────────────────────────────────────────
// 9. User Acceptance
// ─────────────────────────────────────────────────────────────

function UserAcceptanceSection({ section }) {
    if (!section) return null
    return (
        <section
            id="user-acceptance"
            className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm"
        >
            <div className="px-8 py-5">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                    User Acceptance
                </h3>
                <p className="mt-2 text-text-secondary text-sm">
                    {section.description}
                </p>
            </div>
        </section>
    )
}
