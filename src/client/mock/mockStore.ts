import type { Command, CommandOutcome } from '../shared/api/commands'
import type { Shift, Snapshot, Staff } from '../shared/domain/types'
import { recordBriefingGenerated } from '../features/handoff/handoffCommands'
import { applyCommand } from '../app/applyCommand'
import { buildMockSnapshot, MOCK_NOW_MS } from './mockData'

/**
 * PROTOTYPE ONLY: the live demo data, kept in this page's memory.
 *
 * Every account in this browser tab shares it, so a change made as one person is seen by the
 * next person who signs in. Nothing is saved anywhere: reloading the page, or "Reset demo data"
 * in Prototype tools, brings back the original dataset.
 *
 * It applies the same rule functions the ServiceNow server must implement. It is a stand-in for
 * the server, NOT a security control: anyone can change browser memory.
 */

let state: Snapshot = buildMockSnapshot()
let clockStartedAt = Date.now()

/** Demo clock: starts at the dataset's fixed "now" and moves forward in real time. */
function mockNow(): string {
    return new Date(MOCK_NOW_MS + (Date.now() - clockStartedAt)).toISOString()
}

export function readMockState(): Snapshot {
    return { ...state, generatedAt: mockNow() }
}

export function resetMockStore(): void {
    state = buildMockSnapshot()
    clockStartedAt = Date.now()
}

export function dispatchMockCommand(command: Command, actor: Staff): CommandOutcome {
    const result = applyCommand(state, { actor, now: mockNow() }, command)
    if (!result.ok) return result
    state = result.snapshot
    return { ok: true }
}

/** Audits a template briefing, as the server does for every briefing. */
export function recordMockBriefing(actor: Staff, shift: Shift): void {
    const result = recordBriefingGenerated(state, { actor, now: mockNow() }, { shift, source: 'simulated' })
    if (result.ok) state = result.snapshot
}
