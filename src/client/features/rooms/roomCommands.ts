import type { Room, Snapshot } from '../../shared/domain/types.ts'
import { fail, notAvailable, withAudit } from '../../shared/domain/commandKit.ts'
import type { CommandContext, RuleResult } from '../../shared/domain/commandKit.ts'
import { failBlockedReason, passBlockedReason, submitBlockedReason } from './roomActions.ts'
import { buildRoomViews } from './roomViews.ts'

/**
 * Inspection rules. Only a supervisor can pass a room, and only when all three readiness rules
 * are met (see readiness.ts). That is the ONLY way a room becomes Ready.
 *
 * These run on the ServiceNow server for every request (src/server/api/handlers.ts), and in
 * the browser for the local preview.
 */

function viewFor(snapshot: Snapshot, roomId: string) {
    return buildRoomViews(snapshot).find((v) => v.room.id === roomId)
}

function replaceRoom(snapshot: Snapshot, room: Room): Snapshot {
    return { ...snapshot, rooms: snapshot.rooms.map((r) => (r.id === room.id ? room : r)) }
}

export function submitForInspection(snapshot: Snapshot, ctx: CommandContext, input: { roomId: string }): RuleResult {
    if (ctx.actor.role !== 'housekeeping') return fail('forbidden', 'Only the assigned housekeeper can submit a room for inspection.')
    const view = viewFor(snapshot, input.roomId)
    if (!view || view.room.assigneeId !== ctx.actor.id) return notAvailable('room')
    const reason = submitBlockedReason(view)
    if (reason) return fail('conflict', reason)

    const room: Room = { ...view.room, inspection: 'pending', inspectionAt: ctx.now }
    return {
        ok: true,
        snapshot: withAudit(replaceRoom(snapshot, room), ctx, [
            { action: 'inspection_requested', roomId: room.id, targetId: room.id, summary: `${ctx.actor.name} submitted Room ${room.id} for inspection.` },
        ]),
    }
}

export function recordInspection(snapshot: Snapshot, ctx: CommandContext, input: { roomId: string; result: 'passed' | 'failed' }): RuleResult {
    if (ctx.actor.role !== 'supervisor') return fail('forbidden', 'Only a supervisor can record an inspection.')
    const view = viewFor(snapshot, input.roomId)
    if (!view) return notAvailable('room')
    const reason = input.result === 'passed' ? passBlockedReason(view) : failBlockedReason(view)
    if (reason) return fail('conflict', reason)

    const room: Room = { ...view.room, inspection: input.result, inspectionAt: ctx.now }
    const summary =
        input.result === 'passed'
            ? `${ctx.actor.name} passed the inspection. Room ${room.id} is Ready.`
            : `${ctx.actor.name} failed the inspection of Room ${room.id}.`
    return {
        ok: true,
        snapshot: withAudit(replaceRoom(snapshot, room), ctx, [
            { action: input.result === 'passed' ? 'inspection_passed' : 'inspection_failed', roomId: room.id, targetId: room.id, summary },
        ]),
    }
}
