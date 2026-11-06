import React from 'react'
import type { ReactNode } from 'react'
import type { ApiErrorKind } from '../api/dataSource'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface StateScreenProps {
    icon: IconName
    title: string
    message: string
    tone?: 'neutral' | 'danger' | 'warning'
    children?: ReactNode
}

/** Generic centered state card used for empty, error and access states. */
export function StateScreen({ icon, title, message, tone = 'neutral', children }: StateScreenProps) {
    return (
        <section className={`state-screen state-screen--${tone}`} aria-live="polite">
            <div className="state-screen__icon">
                <Icon name={icon} size={28} />
            </div>
            <h2>{title}</h2>
            <p>{message}</p>
            {children ? <div className="state-screen__actions">{children}</div> : null}
        </section>
    )
}

export function LoadingState({ label = 'Loading' }: { label?: string }) {
    return (
        <div className="loading" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <span>{label}...</span>
        </div>
    )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
    return <StateScreen icon="search" title={title} message={message} />
}

interface ErrorStateProps {
    kind: ApiErrorKind
    message: string
    onRetry?: () => void
    /** Called by the "Sign in again" button for expired or missing sessions. */
    onSignIn?: () => void
}

const ERROR_PRESENTATION: Record<ApiErrorKind, { icon: IconName; title: string; tone: 'danger' | 'warning' }> = {
    unauthenticated: { icon: 'lock', title: 'Sign in required', tone: 'warning' },
    expired: { icon: 'clock', title: 'Session expired', tone: 'warning' },
    forbidden: { icon: 'lock', title: 'Access denied', tone: 'danger' },
    not_found: { icon: 'search', title: 'Not found', tone: 'warning' },
    server: { icon: 'alert', title: 'Unable to load data', tone: 'danger' },
    network: { icon: 'alert', title: 'Connection problem', tone: 'danger' },
}

/**
 * Maps a safe ApiError kind to the right screen. In the real app, "Sign in" would
 * send the user to the ServiceNow login page. Authentication stays with ServiceNow.
 */
export function ErrorState({ kind, message, onRetry, onSignIn }: ErrorStateProps) {
    const p = ERROR_PRESENTATION[kind]
    const canRetry = kind === 'server' || kind === 'network'
    return (
        <StateScreen icon={p.icon} title={p.title} message={message} tone={p.tone}>
            {canRetry && onRetry ? (
                <button type="button" className="btn btn--primary" onClick={onRetry}>
                    <Icon name="refresh" size={16} /> Try again
                </button>
            ) : null}
            {(kind === 'unauthenticated' || kind === 'expired') && onSignIn ? (
                <button type="button" className="btn btn--primary" onClick={onSignIn}>
                    <Icon name="lock" size={16} /> Sign in again
                </button>
            ) : null}
        </StateScreen>
    )
}
