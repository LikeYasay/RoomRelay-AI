import type { Command } from '../shared/api/commands.ts'
import type { CommandContext, RuleResult } from '../shared/domain/commandKit.ts'
import type { Snapshot } from '../shared/domain/types.ts'
import { completeTask, markTaskCouldntComplete, reopenTask } from '../features/housekeeping/taskCommands.ts'
import { reportDefect, resolveDefect, startDefect, triageDefect } from '../features/maintenance/defectCommands.ts'
import { recordInspection, submitForInspection } from '../features/rooms/roomCommands.ts'

/**
 * Routes a command to the feature rule that handles it. Pure: data in, new data (or a safe
 * failure) out. Used by both the in-memory demo store (mock/mockStore.ts) and the ServiceNow
 * server (src/server/api/commands.ts), so the browser demo and the server apply identical rules.
 */
export function applyCommand(snapshot: Snapshot, ctx: CommandContext, command: Command): RuleResult {
    switch (command.type) {
        case 'task.complete':
            return completeTask(snapshot, ctx, command)
        case 'task.couldntComplete':
            return markTaskCouldntComplete(snapshot, ctx, command)
        case 'task.reopen':
            return reopenTask(snapshot, ctx, command)
        case 'defect.report':
            return reportDefect(snapshot, ctx, command)
        case 'defect.triage':
            return triageDefect(snapshot, ctx, command)
        case 'defect.start':
            return startDefect(snapshot, ctx, command)
        case 'defect.resolve':
            return resolveDefect(snapshot, ctx, command)
        case 'room.submitInspection':
            return submitForInspection(snapshot, ctx, command)
        case 'room.recordInspection':
            return recordInspection(snapshot, ctx, command)
    }
}
