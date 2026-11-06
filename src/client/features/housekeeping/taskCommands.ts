import { INCOMPLETE_REASON_LABEL } from '../../shared/domain/labels'
import type { HousekeepingTask, IncompleteReason, Snapshot } from '../../shared/domain/types'
import { fail, notAvailable, withAudit } from '../../shared/domain/commandKit'
import type { CommandContext, RuleResult } from '../../shared/domain/commandKit'
import { createDefectRecord } from '../maintenance/defectCommands'
import { validateIncomplete } from './taskValidation'

/**
 * Housekeeping task rules. A task is Pending, Completed or Couldn't Complete.
 *
 *   Pending -> Completed               the assigned housekeeper did the work
 *   Pending -> Couldn't Complete       with a reason; "Needs maintenance" also creates a New defect
 *   Couldn't Complete -> Pending       by the housekeeper or a supervisor (for example, supplies arrived).
 *                                      For "Needs maintenance" this happens automatically when the defect is resolved.
 *
 * There is no waiver: a mandatory task holds the room back until it is Completed.
 * Completed is final in this prototype (a failed inspection is how mistakes get caught).
 *
 * PROTOTYPE NOTE: the ServiceNow server must enforce the same rules on every request.
 */

function findTask(snapshot: Snapshot, ctx: CommandContext, taskId: string): HousekeepingTask | RuleResult {
    const task = snapshot.tasks.find((t) => t.id === taskId)
    const visible =
        task !== undefined && (ctx.actor.role === 'supervisor' || (ctx.actor.role === 'housekeeping' && task.assigneeId === ctx.actor.id))
    // Same answer for "does not exist" and "not yours".
    if (!task || !visible) return ctx.actor.role === 'housekeeping' || ctx.actor.role === 'supervisor' ? notAvailable('task') : fail('forbidden', 'Your role cannot change housekeeping tasks.')
    return task
}

function replaceTask(snapshot: Snapshot, task: HousekeepingTask): Snapshot {
    return { ...snapshot, tasks: snapshot.tasks.map((t) => (t.id === task.id ? task : t)) }
}

function roomAwaitingInspection(snapshot: Snapshot, task: HousekeepingTask): boolean {
    return snapshot.rooms.find((r) => r.id === task.roomId)?.inspection === 'pending'
}

export function completeTask(snapshot: Snapshot, ctx: CommandContext, input: { taskId: string }): RuleResult {
    if (ctx.actor.role !== 'housekeeping') return fail('forbidden', 'Only the assigned housekeeper can complete a task.')
    const task = findTask(snapshot, ctx, input.taskId)
    if ('ok' in task) return task
    if (task.status !== 'pending') return fail('conflict', task.status === 'completed' ? 'This task is already completed.' : "Set this task back to Pending before completing it.")

    const updated: HousekeepingTask = { ...task, status: 'completed', completedAt: ctx.now }
    return {
        ok: true,
        snapshot: withAudit(replaceTask(snapshot, updated), ctx, [
            { action: 'task_completed', roomId: task.roomId, targetId: task.id, summary: `${ctx.actor.name} completed "${task.title}".` },
        ]),
    }
}

export function markTaskCouldntComplete(
    snapshot: Snapshot,
    ctx: CommandContext,
    input: { taskId: string; reason: IncompleteReason | string; note?: string }
): RuleResult {
    if (ctx.actor.role !== 'housekeeping') return fail('forbidden', 'Only the assigned housekeeper can mark a task as Couldn\'t Complete.')
    const task = findTask(snapshot, ctx, input.taskId)
    if ('ok' in task) return task
    if (task.status !== 'pending') return fail('conflict', 'Only a Pending task can be marked Couldn\'t Complete.')
    if (roomAwaitingInspection(snapshot, task)) return fail('conflict', 'This room is waiting for inspection. Ask a supervisor first.')

    const result = validateIncomplete({ reason: input.reason, note: input.note ?? '' })
    if (!result.ok) return fail('invalid', 'Check the highlighted fields.', result.errors as Record<string, string>)
    const { reason, note } = result.value

    let next = snapshot
    let linkedDefectId: string | undefined
    if (reason === 'needs_maintenance') {
        // The defect starts as New and Normal. A supervisor triages it (technician and priority).
        const created = createDefectRecord(next, ctx, {
            roomId: task.roomId,
            title: `Maintenance needed: ${task.title}`,
            description: note ?? 'Reported from the housekeeping checklist: this task cannot be completed until the problem is fixed.',
            priority: 'normal',
            sourceTaskId: task.id,
        })
        next = created.snapshot
        linkedDefectId = created.defect.id
    }

    const updated: HousekeepingTask = {
        ...task,
        status: 'couldnt_complete',
        incompleteReason: reason,
        incompleteNote: note,
        incompleteAt: ctx.now,
        linkedDefectId: linkedDefectId ?? task.linkedDefectId,
        repairNote: undefined,
    }
    next = withAudit(replaceTask(next, updated), ctx, [
        {
            action: 'task_couldnt_complete',
            roomId: task.roomId,
            targetId: task.id,
            summary: `${ctx.actor.name} marked "${task.title}" Couldn't Complete (${INCOMPLETE_REASON_LABEL[reason]}).`,
        },
    ])
    return { ok: true, snapshot: next }
}

export function reopenTask(snapshot: Snapshot, ctx: CommandContext, input: { taskId: string }): RuleResult {
    if (ctx.actor.role !== 'housekeeping' && ctx.actor.role !== 'supervisor') return fail('forbidden', 'Your role cannot change housekeeping tasks.')
    const task = findTask(snapshot, ctx, input.taskId)
    if ('ok' in task) return task
    if (task.status !== 'couldnt_complete') return fail('conflict', "Only a Couldn't Complete task can be set back to Pending.")

    const linked = task.linkedDefectId ? snapshot.defects.find((d) => d.id === task.linkedDefectId) : undefined
    if (task.incompleteReason === 'needs_maintenance' && linked && linked.status !== 'resolved') {
        return fail('conflict', 'This task is waiting for maintenance. It goes back to Pending automatically when the repair is recorded.')
    }

    const updated: HousekeepingTask = { ...task, status: 'pending', incompleteReason: undefined, incompleteNote: undefined, incompleteAt: undefined }
    return {
        ok: true,
        snapshot: withAudit(replaceTask(snapshot, updated), ctx, [
            { action: 'task_reopened', roomId: task.roomId, targetId: task.id, summary: `${ctx.actor.name} set "${task.title}" back to Pending.` },
        ]),
    }
}
