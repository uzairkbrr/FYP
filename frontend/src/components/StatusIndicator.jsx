import React from 'react'

const STATUS_CONFIG = {
    idle: {
        label: 'Ready',
        color: 'bg-text-muted',
        textColor: 'text-text-muted',
        animate: false,
    },
    listening: {
        label: 'Listening...',
        color: 'bg-primary',
        textColor: 'text-primary',
        animate: true,
    },
    processing: {
        label: 'Processing...',
        color: 'bg-warning',
        textColor: 'text-warning',
        animate: true,
    },
    responding: {
        label: 'Responding',
        color: 'bg-success',
        textColor: 'text-success',
        animate: false,
    },
    error: {
        label: 'Error occurred',
        color: 'bg-error',
        textColor: 'text-error',
        animate: false,
    },
}

export default function StatusIndicator({ status = 'idle' }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.idle

    return (
        <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
                {config.animate && (
                    <span
                        className={`absolute inline-flex h-full w-full rounded-full ${config.color} opacity-75 animate-ping`}
                    />
                )}
                <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${config.color}`}
                />
            </span>
            <span className={`text-sm font-medium ${config.textColor}`}>
                {config.label}
            </span>
        </div>
    )
}
