import type { Snapshot } from '../types/domain'

/**
 * Data access boundary for the whole UI.
 *
 * Components never call fetch() directly. They depend on this interface, so in
 * Phase 4 a ServiceNow-backed implementation (authenticated REST calls with the
 * session token, server-side ACLs) can replace the mock without touching the UI.
 */

export type ApiErrorKind = 'unauthenticated' | 'expired' | 'forbidden' | 'not_found' | 'server' | 'network'

/** Error whose message is always safe to show to a user (no server internals). */
export class ApiError extends Error {
    readonly kind: ApiErrorKind

    constructor(kind: ApiErrorKind, message?: string) {
        super(message ?? SAFE_MESSAGES[kind])
        this.name = 'ApiError'
        this.kind = kind
    }
}

const SAFE_MESSAGES: Record<ApiErrorKind, string> = {
    unauthenticated: 'You are not signed in.',
    expired: 'Your session has expired. Please sign in again.',
    forbidden: 'You do not have permission to view this information.',
    not_found: 'The requested information could not be found.',
    server: 'Something went wrong while loading data. Please try again.',
    network: 'The network connection was interrupted. Please check your connection and try again.',
}

/** Scenarios that only the mock data source understands (used to demo UI states). */
export type DemoScenario = 'normal' | 'unauthenticated' | 'expired' | 'forbidden' | 'server_error'

export interface SnapshotRequest {
    signal?: AbortSignal
    /** Ignored by real data sources. */
    demoScenario?: DemoScenario
}

export interface RoomRelayDataSource {
    getSnapshot(request?: SnapshotRequest): Promise<Snapshot>
}
