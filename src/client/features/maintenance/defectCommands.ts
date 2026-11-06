import { DEFECT_PRIORITY_META } from '../../shared/domain/labels.ts'
import type { Defect, DefectPriority, Snapshot } from '../../shared/domain/types.ts'
import { fail, notAvailable, staffName, withAudit } from '../../shared/domain/commandKit.ts'
import type { CommandContext, RuleResult } from '../../shared/domain/commandKit.ts'
import { validateDefectReport, validateResolution, validateTriage } from './defectValidation.ts'

/**
 * Defect rules: who may report, triage, start and resolve a defect, and what each step changes.
 *
 *   New -> (supervisor assigns a technician and sets the priority) -> Assigned
 *   Assigned -> (the technician starts) -> In progress
 *   Assigned / In progress -> (the technician records a resolution) -> Resolved
 *
 * Resolving a defect that came from a "Couldn't Complete: Needs maintenance" task puts that
 * task back to Pending, with the repair note, so the housekeeper re-checks the area.
 *
 * These run on the ServiceNow server for every request (src/server/api/handlers.ts), and in
 * the browser for the local preview.
 */

export function technicianIds(snapshot: Snapshot): string[] {
    return snapshot.staff.filter((s) => s.role === 'maintenance').map((s) => s.id)
}

/** Rooms a role may report a defect against: a housekeeper's own rooms, or every room for a supervisor. */
function reportableRoomIds(snapshot: Snapshot, ctx: CommandContext): string[] {
    if (ctx.actor.role === 'supervisor') return snapshot.rooms.map((r) => r.id)
    if (ctx.actor.role === 'housekeeping') return snapshot.rooms.filter((r) => r.assigneeId === ctx.actor.id).map((r) => r.id)
    return []
}

function nextDefectId(snapshot: Snapshot, roomId: string): string {
    const n = snapshot.defects.filter((d) => d.roomId === roomId).length + 1
    return `D-${roomId}-${n}`
}

function replaceDefect(snapshot: Snapshot, defect: Defect): Snapshot {
    return { ...snapshot, defects: snapshot.defects.map((d) => (d.id === defect.id ? defect : d)) }
}

/**
 * Adds a defect record without checking who is asking. Only called by rules that have already
 * done their own permission checks (reportDefect below, and the housekeeping "Needs maintenance" rule).
 */
export function createDefectRecord(
    snapshot: Snapshot,
    ctx: CommandContext,
    input: { roomId: string; title: string; description: string; priority: DefectPriority; technicianId?: string; sourceTaskId?: string }
): { snapshot: Snapshot; defect: Defect } {
    const defect: Defect = {
        id: nextDefectId(snapshot, input.roomId),
        roomId: input.roomId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: input.technicianId ? 'assigned' : 'new',
        reportedById: ctx.actor.id,
        reportedAt: ctx.now,
        sourceTaskId: input.sourceTaskId,
    }
    if (input.technicianId) {
        defect.technicianId = input.technicianId
        defect.assignedById = ctx.actor.id
        defect.assignedAt = ctx.now
    }

    let next: Snapshot = { ...snapshot, defects: [...snapshot.defects, defect] }
    next = withAudit(next, ctx, [
        { action: 'defect_reported', roomId: defect.roomId, targetId: defect.id, summary: `${ctx.actor.name} reported "${defect.title}".` },
    ])
    if (defect.technicianId) {
        next = withAudit(next, ctx, [
            {
                action: 'defect_assigned',
                roomId: defect.roomId,
                targetId: defect.id,
                summary: `${ctx.actor.name} assigned "${defect.title}" to ${staffName(snapshot, defect.technicianId)} with priority ${DEFECT_PRIORITY_META[defect.priority].label}.`,
            },
        ])
    }
    return { snapshot: next, defect }
}

export function reportDefect(
    snapshot: Snapshot,
    ctx: CommandContext,
    input: { roomId: string; title: string; description: string; priority?: DefectPriority; technicianId?: string }
): RuleResult {
    const role = ctx.actor.role
    if (role !== 'housekeeping' && role !== 'supervisor') return fail('forbidden', 'Your role cannot report defects.')
    // Only supervisors set the priority or assign a technician; a housekeeper's report always starts as New and Normal.
    if (role !== 'supervisor' && (input.priority !== undefined || input.technicianId !== undefined)) {
        return fail('forbidden', 'Only a supervisor can set the priority or assign a technician.')
    }

    const result = validateDefectReport(
        { roomId: input.roomId, title: input.title, description: input.description, priority: input.priority ?? '', technicianId: input.technicianId ?? '' },
        { allowedRoomIds: reportableRoomIds(snapshot, ctx), technicianIds: technicianIds(snapshot) }
    )
    if (!result.ok) return fail('invalid', 'Check the highlighted fields.', result.errors as Record<string, string>)

    return { ok: true, snapshot: createDefectRecord(snapshot, ctx, result.value).snapshot }
}

/** Supervisor assigns a technician and sets (or changes) the priority. Allowed until the defect is resolved. */
export function triageDefect(
    snapshot: Snapshot,
    ctx: CommandContext,
    input: { defectId: string; technicianId: string; priority: DefectPriority }
): RuleResult {
    if (ctx.actor.role !== 'supervisor') return fail('forbidden', 'Only a supervisor can assign defects or change their priority.')
    const defect = snapshot.defects.find((d) => d.id === input.defectId)
    if (!defect) return notAvailable('defect')
    if (defect.status === 'resolved') return fail('conflict', 'This defect is already resolved.')

    const result = validateTriage(input, technicianIds(snapshot))
    if (!result.ok) return fail('invalid', 'Check the highlighted fields.', result.errors as Record<string, string>)
    const { technicianId, priority } = result.value

    const technicianChanged = defect.technicianId !== technicianId
    const priorityChanged = defect.priority !== priority
    if (!technicianChanged && !priorityChanged) return fail('conflict', 'Nothing changed: this technician and priority are already set.')

    const updated: Defect = { ...defect, priority }
    if (technicianChanged) {
        updated.technicianId = technicianId
        updated.assignedById = ctx.actor.id
        updated.assignedAt = ctx.now
        // A new technician starts from Assigned, even if the previous one had started.
        updated.status = 'assigned'
        updated.startedAt = undefined
    }

    const entries = []
    if (technicianChanged) {
        entries.push({
            action: 'defect_assigned' as const,
            roomId: defect.roomId,
            targetId: defect.id,
            summary: `${ctx.actor.name} assigned "${defect.title}" to ${staffName(snapshot, technicianId)} with priority ${DEFECT_PRIORITY_META[priority].label}.`,
        })
    } else {
        entries.push({
            action: 'defect_priority_changed' as const,
            roomId: defect.roomId,
            targetId: defect.id,
            summary: `${ctx.actor.name} changed the priority of "${defect.title}" from ${DEFECT_PRIORITY_META[defect.priority].label} to ${DEFECT_PRIORITY_META[priority].label}.`,
        })
    }
    return { ok: true, snapshot: withAudit(replaceDefect(snapshot, updated), ctx, entries) }
}

function ownDefect(snapshot: Snapshot, ctx: CommandContext, defectId: string): Defect | RuleResult {
    if (ctx.actor.role !== 'maintenance') return fail('forbidden', 'Only maintenance staff can work on defects.')
    const defect = snapshot.defects.find((d) => d.id === defectId)
    // A technician cannot tell "assigned to someone else" from "does not exist".
    if (!defect || defect.technicianId !== ctx.actor.id) return notAvailable('defect')
    return defect
}

export function startDefect(snapshot: Snapshot, ctx: CommandContext, input: { defectId: string }): RuleResult {
    const found = ownDefect(snapshot, ctx, input.defectId)
    if ('ok' in found) return found
    if (found.status !== 'assigned') return fail('conflict', found.status === 'in_progress' ? 'Work on this defect has already started.' : 'This defect is already resolved.')
    const updated: Defect = { ...found, status: 'in_progress', startedAt: ctx.now }
    return {
        ok: true,
        snapshot: withAudit(replaceDefect(snapshot, updated), ctx, [
            { action: 'defect_started', roomId: found.roomId, targetId: found.id, summary: `${ctx.actor.name} started work on "${found.title}".` },
        ]),
    }
}

export function resolveDefect(snapshot: Snapshot, ctx: CommandContext, input: { defectId: string; notes: string }): RuleResult {
    const found = ownDefect(snapshot, ctx, input.defectId)
    if ('ok' in found) return found
    if (found.status === 'resolved') return fail('conflict', 'This defect is already resolved.')

    const result = validateResolution(input.notes)
    if (!result.ok) return fail('invalid', 'Check the highlighted fields.', result.errors as Record<string, string>)

    const updated: Defect = { ...found, status: 'resolved', resolvedAt: ctx.now, resolutionNotes: result.value.notes }
    let next = withAudit(replaceDefect(snapshot, updated), ctx, [
        { action: 'defect_resolved', roomId: found.roomId, targetId: found.id, summary: `${ctx.actor.name} resolved "${found.title}".` },
    ])

    // The housekeeping task that raised this defect goes back to Pending, with the repair note attached.
    const task = found.sourceTaskId ? next.tasks.find((t) => t.id === found.sourceTaskId) : undefined
    if (task && task.status === 'couldnt_complete') {
        next = {
            ...next,
            tasks: next.tasks.map((t) =>
                t.id === task.id
                    ? { ...t, status: 'pending' as const, incompleteReason: undefined, incompleteNote: undefined, incompleteAt: undefined, repairNote: result.value.notes }
                    : t
            ),
        }
        next = withAudit(next, ctx, [
            {
                action: 'task_reopened',
                roomId: task.roomId,
                targetId: task.id,
                summary: `"${task.title}" went back to Pending after the repair, for ${staffName(snapshot, task.assigneeId)} to finish.`,
            },
        ])
    }
    return { ok: true, snapshot: next }
}
