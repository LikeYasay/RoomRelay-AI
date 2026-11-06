import type { CommandFailureKind } from '../api/commands'
import type { AuditEntry, Snapshot, Staff } from './types'

/**
 * Small helpers shared by every feature's command rules (features/<slice>/*Commands.ts).
 * A command rule is a pure function: (snapshot, context, input) -> new snapshot or a failure.
 * It never changes its input, so the rules are easy to test and to port to the server.
 */

export interface CommandContext {
    actor: Staff
    /** ISO timestamp for "now", passed in so results are deterministic in tests. */
    now: string
}

export type RuleResult =
    | { ok: true; snapshot: Snapshot }
    | { ok: false; kind: CommandFailureKind; message: string; fieldErrors?: Record<string, string> }

export function fail(kind: CommandFailureKind, message: string, fieldErrors?: Record<string, string>): RuleResult {
    return { ok: false, kind, message, fieldErrors }
}

/** Same answer for "does not exist" and "not yours", so a user cannot probe for other people's records. */
export function notAvailable(what: string): RuleResult {
    return fail('not_found', `That ${what} is not available.`)
}

export function staffName(snapshot: Snapshot, id: string | undefined): string {
    return snapshot.staff.find((s) => s.id === id)?.name ?? 'Unknown'
}

function nextAuditId(audit: AuditEntry[]): string {
    const max = audit.reduce((n, e) => Math.max(n, Number(e.id.replace(/\D/g, '')) || 0), 0)
    return `A-${String(max + 1).padStart(4, '0')}`
}

/** Appends audit entries for the acting user. Existing entries are never edited or removed. */
export function withAudit(
    snapshot: Snapshot,
    ctx: CommandContext,
    entries: Array<Omit<AuditEntry, 'id' | 'at' | 'actorId'>>
): Snapshot {
    const audit = [...snapshot.audit]
    for (const e of entries) audit.push({ id: nextAuditId(audit), at: ctx.now, actorId: ctx.actor.id, ...e })
    return { ...snapshot, audit }
}
