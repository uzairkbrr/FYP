import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'
const AUTH_STORAGE_KEY = 'adminAuth'
// NOTE: For this FYP/demo we persist Basic-Auth in localStorage. A production
// build should use a short-lived JWT or an httpOnly session cookie instead.


export default function AdminPage() {
    // authHeader is the full "Basic <b64>" string used on every admin call.
    const [authHeader, setAuthHeader] = useState(null)
    const [loginError, setLoginError] = useState('')

    // Hydrate from localStorage on mount — user stays signed in across refreshes.
    useEffect(() => {
        const stored = localStorage.getItem(AUTH_STORAGE_KEY)
        if (stored) setAuthHeader('Basic ' + stored)
    }, [])

    const handleSignOut = useCallback(() => {
        localStorage.removeItem(AUTH_STORAGE_KEY)
        setAuthHeader(null)
        setLoginError('')
    }, [])

    const authedFetch = useCallback(async (url, options = {}) => {
        const res = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: authHeader },
        })
        if (res.status === 401) {
            localStorage.removeItem(AUTH_STORAGE_KEY)
            setAuthHeader(null)
            throw new Error('Unauthorized')
        }
        return res
    }, [authHeader])

    if (!authHeader) {
        return (
            <div className="min-h-screen font-sans">
                <AdminNavbar authed={false} />
                <LoginGate
                    onLogin={(b64) => {
                        localStorage.setItem(AUTH_STORAGE_KEY, b64)
                        setAuthHeader('Basic ' + b64)
                    }}
                    error={loginError}
                    setError={setLoginError}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen font-sans">
            <AdminNavbar authed onSignOut={handleSignOut} />
            <main className="max-w-5xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-black text-text-primary tracking-tight mb-12 font-serif italic">
                    Admin <span className="text-primary not-italic">Panel</span>
                </h1>
                <MessagesCard authedFetch={authedFetch} />
                <StatsCard authedFetch={authedFetch} />
                <UploadCard authedFetch={authedFetch} />
            </main>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Admin Navbar (inline — not the public Navbar)
// ---------------------------------------------------------------------------

function AdminNavbar({ authed, onSignOut }) {
    const scrollToUpload = (e) => {
        e.preventDefault()
        const el = document.getElementById('upload-section')
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl font-extrabold text-text-primary tracking-tight">
                        Mahir <span className="text-primary font-medium tracking-normal text-xl">on Call</span>
                    </span>
                </div>

                <div className="flex items-center gap-6">
                    <Link
                        to="/"
                        className="text-[15px] font-bold text-text-secondary hover:text-primary transition-colors"
                    >
                        Home
                    </Link>
                    {authed && (
                        <>
                            <a
                                href="#upload-section"
                                onClick={scrollToUpload}
                                className="text-[15px] font-bold text-text-secondary hover:text-primary transition-colors cursor-pointer"
                            >
                                Upload File
                            </a>
                            <button
                                onClick={onSignOut}
                                className="px-4 py-1.5 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                            >
                                Sign Out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}


// ---------------------------------------------------------------------------
// Login Gate
// ---------------------------------------------------------------------------

function LoginGate({ onLogin, error, setError }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const b64 = btoa(`${username}:${password}`)
        try {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: { Authorization: 'Basic ' + b64 },
            })
            if (res.status === 401) {
                setError('Invalid username or password.')
            } else if (res.ok) {
                onLogin(b64)
            } else {
                setError('Could not connect to server.')
            }
        } catch {
            setError('Could not connect to server.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[70vh] px-6">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm"
            >
                <div className="px-10 py-6 border-b border-border/20">
                    <h2 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                        Admin Access
                    </h2>
                </div>

                <div className="px-10 py-8 space-y-5">
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-text-primary text-sm focus:outline-none focus:border-primary/60 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-text-primary text-sm focus:outline-none focus:border-primary/60 transition-colors"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                            <p className="text-red-800 text-xs font-bold text-center">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold uppercase tracking-widest hover:bg-primary-dark transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying' : 'Sign In'}
                    </button>
                </div>
            </form>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Messages Card + Detail Modal
// ---------------------------------------------------------------------------

function formatTimestamp(ts) {
    if (!ts) return ''
    const d = new Date(ts)
    if (isNaN(d.getTime())) return ts
    return d.toLocaleString([], {
        year: 'numeric', month: 'short', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
    })
}

function StatusBadge({ isRead }) {
    return isRead ? (
        <span className="inline-block px-2 py-0.5 rounded-full bg-background border border-border text-text-muted text-[10px] font-bold uppercase tracking-widest">
            Read
        </span>
    ) : (
        <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">
            New
        </span>
    )
}

function MessagesCard({ authedFetch }) {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedId, setSelectedId] = useState(null)

    const load = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await authedFetch(`${API_URL}/admin/messages`)
            if (!res.ok) throw new Error('Failed to load messages')
            const data = await res.json()
            setMessages(data.messages || [])
        } catch (e) {
            if (e.message !== 'Unauthorized') setError('Could not load messages.')
        } finally {
            setLoading(false)
        }
    }, [authedFetch])

    useEffect(() => { load() }, [load])

    const markRead = useCallback(async (id) => {
        try {
            const res = await authedFetch(`${API_URL}/admin/messages/${id}/read`, {
                method: 'POST',
            })
            if (!res.ok) throw new Error()
            // Optimistic local update for instant UX + silent refresh.
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
            load()
        } catch {
            /* silent */
        }
    }, [authedFetch, load])

    const unreadCount = messages.filter(m => !m.is_read).length
    const selectedMessage = messages.find(m => m.id === selectedId) || null

    return (
        <>
            <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm mb-8">
                <div className="px-8 py-5 border-b border-border/20 flex items-center gap-3">
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                        Moderator Messages
                    </h3>
                    {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold">
                            {unreadCount} new
                        </span>
                    )}
                </div>

                <div className="px-8 py-6">
                    {loading && (
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-text-muted text-sm">Loading messages</span>
                        </div>
                    )}

                    {error && <p className="text-red-600 text-sm">{error}</p>}

                    {!loading && !error && messages.length === 0 && (
                        <p className="text-text-muted text-sm italic">No messages from users yet.</p>
                    )}

                    {!loading && !error && messages.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm table-fixed">
                                <colgroup>
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '22%' }} />
                                    <col style={{ width: '16%' }} />
                                    <col style={{ width: '32%' }} />
                                    <col style={{ width: '12%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-border/40">
                                        <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Timestamp</th>
                                        <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Email</th>
                                        <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Phone</th>
                                        <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Message</th>
                                        <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {messages.map((m) => (
                                        <tr
                                            key={m.id}
                                            className="border-b border-border/20 align-top cursor-pointer hover:bg-background/50 transition-colors"
                                            onClick={() => setSelectedId(m.id)}
                                        >
                                            <td className="py-3 text-text-secondary whitespace-nowrap pr-3">
                                                {formatTimestamp(m.timestamp)}
                                            </td>
                                            <td className="py-3 text-text-secondary pr-3 truncate">{m.email}</td>
                                            <td className="py-3 text-text-secondary pr-3 truncate">{m.phone}</td>
                                            <td className="py-3 text-text-primary pr-3">
                                                <p className="overflow-hidden text-ellipsis" style={{
                                                    display: '-webkit-box',
                                                    WebkitBoxOrient: 'vertical',
                                                    WebkitLineClamp: 2,
                                                }}>
                                                    {m.message}
                                                </p>
                                            </td>
                                            <td className="py-3 pr-3">
                                                <StatusBadge isRead={m.is_read} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {selectedMessage && (
                <MessageDetailModal
                    message={selectedMessage}
                    onClose={() => setSelectedId(null)}
                    onMarkRead={() => markRead(selectedMessage.id)}
                />
            )}
        </>
    )
}

function MessageDetailModal({ message, onClose, onMarkRead }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [onClose])

    const handleBackdrop = (e) => {
        if (e.target === e.currentTarget) onClose()
    }

    return (
        <div
            onClick={handleBackdrop}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.55)' }}
        >
            <div className="w-full max-w-lg rounded-xl border border-border bg-surface shadow-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                    <h3 className="text-base font-bold text-text-primary truncate pr-4">
                        Message from <span className="text-primary">{message.email}</span>
                    </h3>
                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 py-5 space-y-3">
                    <DetailRow label="Received" value={formatTimestamp(message.timestamp)} />
                    <DetailRow label="Email" value={message.email} />
                    <DetailRow label="Phone" value={message.phone} />
                    <DetailRow label="Status" valueNode={<StatusBadge isRead={message.is_read} />} />
                </div>

                <div className="px-6 pb-5">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                        Message
                    </p>
                    <div className="rounded-lg bg-background border border-border px-4 py-3 max-h-[40vh] overflow-y-auto">
                        <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                            {message.message}
                        </p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-2">
                    {!message.is_read && (
                        <button
                            onClick={onMarkRead}
                            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-dark transition-colors cursor-pointer"
                        >
                            Mark as Read
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-surface border border-border text-text-primary text-sm font-bold hover:bg-background transition-colors cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}

function DetailRow({ label, value, valueNode }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest w-20 pt-0.5 shrink-0">
                {label}
            </span>
            {valueNode || <span className="text-sm text-text-primary">{value}</span>}
        </div>
    )
}


// ---------------------------------------------------------------------------
// Stats Card
// ---------------------------------------------------------------------------

function StatsCard({ authedFetch }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const loadStats = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await authedFetch(`${API_URL}/admin/stats`)
            if (!res.ok) throw new Error('Failed to load stats')
            setStats(await res.json())
        } catch (e) {
            if (e.message !== 'Unauthorized') setError('Could not load stats.')
        } finally {
            setLoading(false)
        }
    }, [authedFetch])

    useEffect(() => { loadStats() }, [loadStats])

    useEffect(() => {
        const handler = () => loadStats()
        window.addEventListener('admin-stats-refresh', handler)
        return () => window.removeEventListener('admin-stats-refresh', handler)
    }, [loadStats])

    return (
        <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm mb-8">
            <div className="px-8 py-5 border-b border-border/20">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                    Knowledge Base
                </h3>
            </div>

            <div className="px-8 py-6">
                {loading && (
                    <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-text-muted text-sm">Loading stats</span>
                    </div>
                )}

                {error && <p className="text-red-600 text-sm">{error}</p>}

                {stats && !loading && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/40">
                                <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest w-[35%]">
                                    Category
                                </th>
                                <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    Description
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.sources.map((s) => (
                                <tr key={s.source} className="border-b border-border/20">
                                    <td className="py-2.5 font-medium font-mono text-text-primary text-xs">{s.source}</td>
                                    <td className="py-2.5 text-text-secondary">
                                        {s.description || <span className="text-text-muted">-</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Upload Card
// ---------------------------------------------------------------------------

const ACCEPTED_EXTS = ['.txt', '.pdf', '.docx']

function UploadCard({ authedFetch }) {
    const [file, setFile] = useState(null)
    const [status, setStatus] = useState('idle') // idle | uploading | success | error
    const [message, setMessage] = useState('')
    const [description, setDescription] = useState('')
    const inputRef = useRef(null)
    const dropRef = useRef(null)

    const resetForm = () => {
        setFile(null)
        if (inputRef.current) inputRef.current.value = ''
    }

    const isAccepted = (f) => {
        if (!f || !f.name) return false
        const lower = f.name.toLowerCase()
        return ACCEPTED_EXTS.some(ext => lower.endsWith(ext))
    }

    const handleFile = (f) => {
        if (isAccepted(f)) {
            setFile(f)
            setStatus('idle')
            setMessage('')
        } else if (f) {
            setFile(null)
            setStatus('error')
            setMessage('Only .txt, .pdf, and .docx files are supported')
        }
    }

    const handleDrop = (e) => {
        e.preventDefault()
        dropRef.current?.classList.remove('border-primary')
        const f = e.dataTransfer.files[0]
        handleFile(f)
    }

    const handleDragOver = (e) => {
        e.preventDefault()
        dropRef.current?.classList.add('border-primary')
    }

    const handleDragLeave = () => {
        dropRef.current?.classList.remove('border-primary')
    }

    const handleUpload = async () => {
        if (!file) return
        setStatus('uploading')
        setMessage('')

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await authedFetch(`${API_URL}/admin/ingest`, {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || 'Upload failed')
            }

            const data = await res.json()
            setStatus('success')
            setMessage(`${data.source} added successfully`)
            setDescription(data.description || '')
            resetForm()

            window.dispatchEvent(new Event('admin-stats-refresh'))
        } catch (e) {
            if (e.message !== 'Unauthorized') {
                setStatus('error')
                setMessage(e.message || "Can't add the file into the database")
            }
            resetForm()
        }
    }

    return (
        <div id="upload-section" className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm scroll-mt-24">
            <div className="px-8 py-5 border-b border-border/20">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                    Add to Knowledge Base
                </h3>
            </div>

            <div className="px-8 py-6">
                {status === 'success' && (
                    <div className="mb-5 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-center">
                        <p className="text-green-800 text-sm font-bold">{message}</p>
                        {description && (
                            <p className="text-green-700/70 text-xs mt-1">{description}</p>
                        )}
                    </div>
                )}
                {status === 'error' && (
                    <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                        <p className="text-red-800 text-sm font-bold text-center">{message}</p>
                    </div>
                )}

                {status !== 'uploading' && (
                    <>
                        <div
                            ref={dropRef}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => inputRef.current?.click()}
                            className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary/40 hover:bg-background/50 transition-all"
                        >
                            <svg className="w-10 h-10 mx-auto text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                            {file ? (
                                <p className="text-text-primary text-sm font-bold">{file.name}</p>
                            ) : (
                                <p className="text-text-muted text-sm">
                                    Drag & drop a file here, or click to browse
                                    <br />
                                    <span className="text-text-muted/80">
                                        Accepted formats: .txt, .pdf, .docx
                                    </span>
                                </p>
                            )}
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".txt,.pdf,.docx"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />
                        </div>

                        <div className="mt-4 flex items-center justify-center gap-2">
                            <FormatBadge label="TXT" />
                            <FormatBadge label="PDF" />
                            <FormatBadge label="DOCX" />
                        </div>

                        {file && (
                            <button
                                onClick={handleUpload}
                                className="mt-5 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold uppercase tracking-widest hover:bg-primary-dark transition-all cursor-pointer"
                            >
                                Upload & Embed
                            </button>
                        )}
                    </>
                )}

                {status === 'uploading' && (
                    <div className="py-10 flex flex-col items-center gap-3">
                        <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-10" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span className="text-text-muted text-sm font-medium">Processing</span>
                    </div>
                )}
            </div>
        </div>
    )
}

function FormatBadge({ label }) {
    return (
        <span className="px-2.5 py-0.5 rounded-full bg-background border border-border text-text-muted text-[10px] font-bold uppercase tracking-widest">
            {label}
        </span>
    )
}
