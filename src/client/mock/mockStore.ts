import type { Command, CommandOutcome } from '../shared/api/commands'
import type { Snapshot, Staff } from '../shared/domain/types'
import type { CommandContext, RuleResult } from '../shared/domain/commandKit'
import { recordBriefingGenerated } from '../features/handoff/handoffCommands'
import { completeTask, markTaskCouldntComplete, reopenTask } from '../features/housekeeping/taskCommands'
import { reportDefect, resolveDefect, startDefect, triageDefect } from '../features/maintenance/defectCommands'
import { recordInspection, submitForInspection } from '../features/rooms/roomCommands'
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
export function mockNow(): string {
    return new Date(MOCK_NOW_MS + (Date.now() - clockStartedAt)).toISOString()
}

export function readMockState(): Snapshot {
    return { ...state, generatedAt: mockNow() }
}

export function resetMockStore(): void {
    state = buildMockSnapshot()
    clockStartedAt = Date.now()
}

function apply(command: Command, ctx: CommandContext): RuleResult {
    switch (command.type) {
        case 'task.complete':
            return completeTask(state, ctx, command)
        case 'task.couldntComplete':
            return markTaskCouldntComplete(state, ctx, command)
        case 'task.reopen':
            return reopenTask(state, ctx, command)
        case 'defect.report':
            return reportDefect(state, ctx, command)
        case 'defect.triage':
            return triageDefect(state, ctx, command)
        case 'defect.start':
            return startDefect(state, ctx, command)
        case 'defect.resolve':
            return resolveDefect(state, ctx, command)
        case 'room.submitInspection':
            return submitForInspection(state, ctx, command)
        case 'room.recordInspection':
            return recordInspection(state, ctx, command)
        case 'handoff.briefingGenerated':
            return recordBriefingGenerated(state, ctx, command)
    }
}

export function dispatchMockCommand(command: Command, actor: Staff): CommandOutcome {
    const result = apply(command, { actor, now: mockNow() })
    if (!result.ok) return result
    state = result.snapshot
    return { ok: true }
}
