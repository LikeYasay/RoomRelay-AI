import type { Briefing, Shift, Snapshot } from '../domain/types.ts'
import type { Command, CommandOutcome } from './commands.ts'

/**
 * Data access boundary for the whole UI.
 *
 * Components never call fetch() directly. They depend on this interface, which has two
 * implementations: serviceNowDataSource.ts (the RoomRelay REST API) and the in-memory demo
 * (mock/mockDataSource.ts) for the local preview. app/App.tsx picks one.
 */

export type ApiErrorKind = 'unauthenticated' | 'expired' | 'forbidden' | 'not_found' | 'rate_limited' | 'server' | 'network'

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
    rate_limited: 'Too many briefings in a short time. Please wait a few minutes and try again.',
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
    /** Everything the signed-in user may see. The server must already have filtered it. */
    getSnapshot(request?: SnapshotRequest): Promise<Snapshot>
    /**
     * Runs one change (see commands.ts). Resolves with a safe outcome for rule failures
     * (not allowed, invalid input, conflict). Rejects with ApiError for session or network problems.
     */
    execute(command: Command): Promise<CommandOutcome>
    /**
     * Builds the shift briefing (supervisors only). Inside ServiceNow the server asks the AI and falls
     * back to the template; the local preview always uses the template. Rejects with ApiError.
     */
    generateBriefing(shift: Shift): Promise<Briefing>
}
