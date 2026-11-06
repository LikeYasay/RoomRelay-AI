import type { Blocker, Defect, HousekeepingTask, ReadinessResult, Room, RoomStatus } from '../types/domain'
import { plural } from './format'

/**
 * Deterministic room-readiness rules.
 *
 * A room is Ready ONLY when ALL of these are true:
 *   1. Every mandatory housekeeping task is done.
 *   2. No readiness-blocking maintenance defect is unresolved.
 *   3. The required inspection has passed.
 *
 * PROTOTYPE NOTE: this runs in the browser purely to explain status to the user.
 * It is NOT an enforcement point. In Phase 4 the same rules must be implemented
 * server-side (Business Rule + ACL) so they cannot be bypassed through direct API
 * calls. AI-generated text never feeds into this function.
 */

function joinReasons(reasons: string[]): string {
    if (reasons.length <= 1) return reasons.join('')
    return `${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`
}

export function evaluateReadiness(room: Room, tasks: HousekeepingTask[], defects: Defect[]): ReadinessResult {
    const mandatory = tasks.filter((t) => t.mandatory)
    const mandatoryOpen = mandatory.filter((t) => t.status !== 'done')
    const mandatoryStarted = mandatory.filter((t) => t.status !== 'todo')
    const blockingOpen = defects.filter((d) => d.blocking && d.status !== 'resolved')
    const openTasks = tasks.filter((t) => t.status !== 'done').length

    const blockers: Blocker[] = []
    const reasons: string[] = []

    if (mandatoryOpen.length > 0) {
        const label = `${plural(mandatoryOpen.length, 'mandatory task')} remain${mandatoryOpen.length === 1 ? 's' : ''} incomplete`
        blockers.push({ kind: 'mandatory_tasks', message: label, weight: 20, refIds: mandatoryOpen.map((t) => t.id) })
        reasons.push(label)
    }

    if (blockingOpen.length > 0) {
        const label = `${plural(blockingOpen.length, 'blocking maintenance defect')} ${blockingOpen.length === 1 ? 'is' : 'are'} unresolved`
        const worst = blockingOpen.some((d) => d.severity === 'critical') ? 40 : blockingOpen.some((d) => d.severity === 'high') ? 30 : 25
        blockers.push({ kind: 'blocking_defect', message: label, weight: worst, refIds: blockingOpen.map((d) => d.id) })
        reasons.push(label)
    }

    if (room.inspection !== 'passed') {
        const label =
            room.inspection === 'failed'
                ? 'the last inspection failed and must be repeated'
                : room.inspection === 'pending'
                  ? 'the required inspection is still pending'
                  : 'the required inspection has not been requested'
        blockers.push({ kind: 'inspection', message: label, weight: room.inspection === 'failed' ? 35 : 10, refIds: [room.id] })
        reasons.push(label)
    }

    blockers.sort((a, b) => b.weight - a.weight)

    let status: RoomStatus
    if (blockingOpen.length > 0 || room.inspection === 'failed') {
        status = 'blocked'
    } else if (mandatoryOpen.length > 0) {
        status = mandatoryStarted.length > 0 ? 'in_progress' : 'needs_cleaning'
    } else if (room.inspection !== 'passed') {
        status = 'pending_inspection'
    } else {
        status = 'ready'
    }

    return {
        status,
        isReady: status === 'ready',
        blockers,
        mandatoryTotal: mandatory.length,
        mandatoryDone: mandatory.length - mandatoryOpen.length,
        openTasks,
        openBlockingDefects: blockingOpen.length,
        summary:
            reasons.length === 0
                ? `Room ${room.id} meets every readiness requirement.`
                : `Room ${room.id} cannot be marked Ready because ${joinReasons(reasons)}.`,
    }
}
