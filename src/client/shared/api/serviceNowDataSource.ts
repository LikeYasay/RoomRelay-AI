import type { Briefing, Shift, Snapshot, Staff } from '../domain/types'
import type { Command, CommandFailureKind, CommandOutcome } from './commands'
import { ApiError } from './dataSource'
import type { RoomRelayDataSource, SnapshotRequest } from './dataSource'
import { sessionToken } from './environment'

/**
 * The real data source: calls the RoomRelay Scripted REST API on the same ServiceNow instance.
 * The browser sends no identity and no role; ServiceNow knows the user from the session cookie,
 * and the X-UserToken header protects against cross-site requests.
 */

const BASE = '/api/x_2305075_roomrela/v1/roomrelay'
const FAILURE_KINDS: CommandFailureKind[] = ['forbidden', 'not_found', 'invalid', 'conflict']

interface ApiErrorBody {
    error?: { code?: string; message?: string; fieldErrors?: Record<string, string> }
}

async function call(path: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
    const token = sessionToken()
    let res: Response
    try {
        res = await fetch(BASE + path, {
            ...init,
            credentials: 'same-origin',
            headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { 'X-UserToken': token } : {}) },
        })
    } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') throw err
        throw new ApiError('network')
    }
    let json: unknown = null
    try {
        json = await res.json()
    } catch {
        // Empty or non-JSON body: handled by the status code below.
    }
    // Scripted REST wraps every body in { result: ... }.
    const body = json && typeof json === 'object' && 'result' in json ? (json as { result: unknown }).result : json
    return { status: res.status, body }
}

/** Turns a failed read into a safe ApiError. Server text is never shown for these. */
function readError(status: number): ApiError {
    if (status === 401) return new ApiError('unauthenticated')
    if (status === 403) return new ApiError('forbidden')
    if (status === 404) return new ApiError('not_found')
    return new ApiError('server')
}

export class ServiceNowDataSource implements RoomRelayDataSource {
    async getSnapshot(request: SnapshotRequest = {}): Promise<Snapshot> {
        const { status, body } = await call('/snapshot', { method: 'GET', signal: request.signal })
        const snapshot = body as Snapshot | null
        if (status !== 200 || !snapshot || !Array.isArray(snapshot.rooms)) throw readError(status)
        return snapshot
    }

    async execute(command: Command): Promise<CommandOutcome> {
        const { status, body } = await call('/commands', { method: 'POST', body: JSON.stringify(command) })
        if (status === 200) return { ok: true }
        const error = (body as ApiErrorBody | null)?.error
        const kind = FAILURE_KINDS.find((k) => k === error?.code)
        // Rule failures carry a safe message written by the shared rules; anything else is generic.
        if (kind && typeof error?.message === 'string') {
            return { ok: false, kind, message: error.message.slice(0, 300), fieldErrors: error.fieldErrors }
        }
        throw readError(status)
    }

    async generateBriefing(shift: Shift): Promise<Briefing> {
        const { status, body } = await call('/handoff/briefing', { method: 'POST', body: JSON.stringify({ shift }) })
        const briefing = (body as { briefing?: Briefing } | null)?.briefing
        if (status === 200 && briefing && Array.isArray(briefing.actions)) return briefing
        if (status === 429) {
            const message = (body as ApiErrorBody | null)?.error?.message
            throw new ApiError('rate_limited', typeof message === 'string' ? message.slice(0, 300) : undefined)
        }
        throw readError(status)
    }
}

/** The signed-in ServiceNow user as RoomRelay staff (GET /me). */
export async function fetchCurrentAccount(): Promise<Staff> {
    const { status, body } = await call('/me', { method: 'GET' })
    const account = (body as { account?: Staff } | null)?.account
    if (status === 403) throw new ApiError('forbidden', 'Your account does not have a RoomRelay role. Ask an administrator for access.')
    if (status !== 200 || !account) throw readError(status)
    return account
}

/** Administrator only: replace all RoomRelay data with the demo dataset (POST /demo/reset). */
export async function resetServerDemoData(): Promise<string | undefined> {
    const { status, body } = await call('/demo/reset', { method: 'POST', body: '{}' })
    if (status === 200) return undefined
    const message = (body as ApiErrorBody | null)?.error?.message
    return typeof message === 'string' ? message.slice(0, 300) : new ApiError('server').message
}
