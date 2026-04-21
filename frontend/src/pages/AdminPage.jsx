import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'

const API_URL = 'http://localhost:8000'
const AUTH_STORAGE_KEY = 'admin-auth'

function loadStoredAuth() {
    try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw)
        if (parsed && typeof parsed.username === 'string' && typeof parsed.password === 'string') {
            return parsed
        }
        return null
    } catch {
        return null
    }
}

export default function AdminPage() {
    const [auth, setAuth] = useState(loadStoredAuth) // { username, password }
    const [loginError, setLoginError] = useState('')

    // Persist credentials across refreshes. Cleared automatically on a 401
    // from authedFetch below, so invalid creds don't linger.
    useEffect(() => {
        if (auth) {
            try { localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth)) } catch { /* ignore */ }
        } else {
            try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* ignore */ }
        }
    }, [auth])

    const authHeader = auth
        ? 'Basic ' + btoa(`${auth.username}:${auth.password}`)
        : null

    const authedFetch = useCallback(async (url, options = {}) => {
        const res = await fetch(url, {
            ...options,
            headers: { ...options.headers, Authorization: authHeader },
        })
        if (res.status === 401) {
            setAuth(null)
            throw new Error('Unauthorized')
        }
        return res
    }, [authHeader])

    if (!auth) {
        return (
            <div className="min-h-screen font-sans">
                <AdminNavbar />
                <LoginGate
                    onLogin={setAuth}
                    error={loginError}
                    setError={setLoginError}
                />
            </div>
        )
    }

    return (
        <div className="min-h-screen font-sans">
            <AdminNavbar onSignOut={() => setAuth(null)} />
            <main className="max-w-[1200px] mx-auto px-6 py-16">
                <h1 className="text-4xl font-black text-text-primary tracking-tight mb-12 font-serif italic">
                    Admin <span className="text-primary not-italic">Panel</span>
                </h1>
                <MessagesCard authedFetch={authedFetch} />
                <StatsCard authedFetch={authedFetch} />
                <div id="upload-section">
                    <UploadCard authedFetch={authedFetch} />
                </div>
            </main>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Admin Navbar
// ---------------------------------------------------------------------------

function AdminNavbar({ onSignOut }) {
    return (
        <nav className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-border transition-all duration-300">
            <div className="max-w-[1380px] mx-auto px-6 py-4 flex items-center justify-between">
                {/* Brand */}
                <Link to="/admin" className="text-xl font-extrabold text-text-primary tracking-tight">
                    Mahir<span className="text-primary">Connect</span>
                </Link>

                {/* Right-side links */}
                <div className="flex items-center gap-8">
                    <Link
                        to="/"
                        className="text-sm font-bold text-text-secondary hover:text-primary transition-colors"
                    >
                        Home
                    </Link>
                    {onSignOut && (
                        <>
                            <a
                                href="#upload-section"
                                className="text-sm font-bold text-text-secondary hover:text-primary transition-colors"
                            >
                                Upload file
                            </a>
                            <button
                                onClick={onSignOut}
                                className="inline-flex items-center px-4 py-2 rounded-2xl bg-primary text-white font-bold text-sm shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            >
                                Sign out
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}


function LoginGate({ onLogin, error, setError }) {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch(`${API_URL}/admin/stats`, {
                headers: {
                    Authorization: 'Basic ' + btoa(`${username}:${password}`),
                },
            })
            if (res.status === 401) {
                setError('Invalid username or password.')
            } else if (res.ok) {
                onLogin({ username, password })
            } else {
                setError('Please try again.')
            }
        } catch {
            setError('Please try again.')
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


function MessagesCard({ authedFetch }) {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [updatingId, setUpdatingId] = useState(null)
    const [selectedMessage, setSelectedMessage] = useState(null)

    // Close the modal when Escape is pressed.
    useEffect(() => {
        if (!selectedMessage) return
        const onKey = (e) => { if (e.key === 'Escape') setSelectedMessage(null) }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [selectedMessage])

    const loadMessages = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const res = await authedFetch(`${API_URL}/admin/messages`)
            if (!res.ok) throw new Error('Failed to load messages')
            const data = await res.json()
            setMessages(Array.isArray(data.messages) ? data.messages : [])
        } catch (e) {
            if (e.message !== 'Unauthorized') setError('Please try again.')
        } finally {
            setLoading(false)
        }
    }, [authedFetch])

    useEffect(() => { loadMessages() }, [loadMessages])

    const toggleRead = async (msg) => {
        setUpdatingId(msg.id)
        const nextRead = !msg.read
        try {
            const res = await authedFetch(`${API_URL}/admin/messages/${msg.id}/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: nextRead }),
            })
            if (!res.ok) throw new Error('Failed to update')
            setMessages((prev) =>
                prev.map((m) => (m.id === msg.id ? { ...m, read: nextRead } : m))
            )
        } catch {
            // silently ignore; UI stays consistent with server state on next load
        } finally {
            setUpdatingId(null)
        }
    }

    return (
        <>
        <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm mb-8">
            <div className="px-8 py-5 border-b border-border/20 flex items-center justify-between">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                    Custom Messages
                </h3>
                <button
                    onClick={loadMessages}
                    disabled={loading}
                    className="text-[10px] font-bold text-text-muted uppercase tracking-widest hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Refresh
                </button>
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
                    <p className="text-text-muted text-sm italic">No messages yet.</p>
                )}

                {!loading && !error && messages.length > 0 && (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/40">
                                <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest w-[22%]">
                                    Email
                                </th>
                                <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest w-[18%]">
                                    Contact
                                </th>
                                <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    Message
                                </th>
                                <th className="text-left py-2 text-[10px] font-bold text-text-muted uppercase tracking-widest w-[110px]">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {messages.map((m) => (
                                <tr
                                    key={m.id}
                                    onClick={() => setSelectedMessage(m)}
                                    className="border-b border-border/20 align-top cursor-pointer hover:bg-background/40 transition-colors"
                                >
                                    <td className="py-3 text-text-primary text-xs break-all pr-3">{m.email}</td>
                                    <td className="py-3 text-text-secondary text-xs break-all pr-3">{m.contact}</td>
                                    <td className="py-3 text-text-secondary text-xs whitespace-pre-wrap pr-3 line-clamp-2">{m.message}</td>
                                    <td className="py-3">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); toggleRead(m) }}
                                            disabled={updatingId === m.id}
                                            title="Click to toggle"
                                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-60 ${m.read
                                                ? 'bg-text-muted/15 text-text-muted border border-text-muted/30'
                                                : 'bg-green-500/15 text-green-500 border border-green-500/40'
                                                }`}
                                        >
                                            {m.read ? 'Read' : 'Unread'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>

        {selectedMessage && (
            <div
                onClick={() => setSelectedMessage(null)}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4"
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-lg rounded-xl border border-border/60 bg-surface shadow-2xl overflow-hidden"
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="px-6 py-4 border-b border-border/30 flex items-center justify-between">
                        <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                            Custom Message
                        </h4>
                        <button
                            onClick={() => setSelectedMessage(null)}
                            className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-background transition-colors cursor-pointer"
                            aria-label="Close"
                            title="Close"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="px-6 py-5 space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Email</p>
                            <p className="text-sm text-text-primary break-all">{selectedMessage.email}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Contact</p>
                            <p className="text-sm text-text-primary break-all">{selectedMessage.contact}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Message</p>
                            <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">{selectedMessage.message}</p>
                        </div>
                    </div>
                </div>
            </div>
        )}
        </>
    )
}


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
            if (e.message !== 'Unauthorized') setError('Please try again.')
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
                    <>
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
                                            {s.description || <span className="text-text-muted">&mdash;</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>
        </div>
    )
}


const SUPPORTED_EXTENSIONS = ['.txt', '.pdf', '.docx']
const ACCEPT_ATTR = SUPPORTED_EXTENSIONS.join(',')

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

    const handleFile = (f) => {
        if (!f) return
        const name = f.name.toLowerCase()
        if (SUPPORTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
            setFile(f)
            setStatus('idle')
            setMessage('')
        } else {
            setStatus('error')
            setMessage(`Unsupported file type. Accepted: ${SUPPORTED_EXTENSIONS.join(', ')}`)
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
                throw new Error('Upload failed')
            }

            const data = await res.json()
            setStatus('success')
            setMessage(`${data.source} added successfully`)
            setDescription(data.description || '')
            resetForm()

            // Refresh the stats card
            window.dispatchEvent(new Event('admin-stats-refresh'))
        } catch (e) {
            if (e.message !== 'Unauthorized') {
                setStatus('error')
                setMessage('Please try again.')
            }
            resetForm()
        }
    }

    return (
        <div className="rounded-xl border border-border/60 bg-surface/50 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-border/20">
                <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.4em]">
                    Add to Knowledge Base
                </h3>
            </div>

            <div className="px-8 py-6">
                {/* Success / Error banners */}
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

                {/* Upload zone */}
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
                                <>
                                    <p className="text-text-muted text-sm">
                                        Drag & drop a file here, or click to browse
                                    </p>
                                    <p className="mt-1.5 text-text-muted text-[10px] uppercase tracking-widest">
                                        {SUPPORTED_EXTENSIONS.join(' · ')}
                                    </p>
                                </>
                            )}
                            <input
                                ref={inputRef}
                                type="file"
                                accept={ACCEPT_ATTR}
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files[0])}
                            />
                        </div>

                        {file && (
                            <button
                                onClick={handleUpload}
                                className="mt-5 w-full py-2.5 rounded-lg bg-primary text-white text-sm font-bold lowercase tracking-widest hover:bg-primary-dark transition-all cursor-pointer"
                            >
                                Upload & Embed
                            </button>
                        )}
                    </>
                )}

                {/* Uploading spinner */}
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
