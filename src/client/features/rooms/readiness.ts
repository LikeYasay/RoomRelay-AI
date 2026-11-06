import type { Blocker, Defect, HousekeepingTask, ReadinessResult, Room, RoomStatus } from '../../shared/domain/types.ts'
import { plural } from '../../shared/lib/format.ts'
import { isBlockingOpen } from '../maintenance/blockers.ts'

/**
 * Deterministic room-readiness rules.
 *
 * A room is Ready ONLY when ALL of these are true:
 *   1. Every mandatory housekeeping task is Completed ("Couldn't Complete" does not count).
 *   2. No defect with priority Blocking is unresolved.
 *   3. The required inspection has passed.
 *
 * Status (derived, never set by hand):
 *   Blocked            an unresolved Blocking defect, or the last inspection failed
 *   Needs Cleaning     no mandatory task has been acted on yet
 *   In Progress        at least one mandatory task is Completed or Couldn't Complete, but not all are Completed
 *   Pending Inspection all mandatory tasks Completed, inspection not passed yet
 *   Ready              all three rules met
 *
 * The same function runs in the browser (to explain status) and on the ServiceNow server
 * (src/server/api/handlers.ts), where it decides. AI-generated text never feeds into it.
 */

function joinReasons(reasons: string[]): string {
    if (reasons.length <= 1) return reasons.join('')
    return `${reasons.slice(0, -1).join(', ')} and ${reasons[reasons.length - 1]}`
}

export function evaluateReadiness(room: Room, tasks: HousekeepingTask[], defects: Defect[]): ReadinessResult {
    const mandatory = tasks.filter((t) => t.mandatory)
    const mandatoryOpen = mandatory.filter((t) => t.status !== 'completed')
    const mandatoryStarted = mandatory.filter((t) => t.status !== 'pending')
    const mandatoryCouldntComplete = mandatory.filter((t) => t.status === 'couldnt_complete').length
    const blockingOpen = defects.filter(isBlockingOpen)
    const openTasks = tasks.filter((t) => t.status !== 'completed').length

    const blockers: Blocker[] = []
    const reasons: string[] = []

    if (mandatoryOpen.length > 0) {
        const label = `${plural(mandatoryOpen.length, 'mandatory task')} remain${mandatoryOpen.length === 1 ? 's' : ''} incomplete`
        blockers.push({ kind: 'mandatory_tasks', message: label, weight: 20, refIds: mandatoryOpen.map((t) => t.id) })
        reasons.push(label)
    }

    if (blockingOpen.length > 0) {
        const label = `${plural(blockingOpen.length, 'blocking maintenance defect')} ${blockingOpen.length === 1 ? 'is' : 'are'} unresolved`
        blockers.push({ kind: 'blocking_defect', message: label, weight: 40, refIds: blockingOpen.map((d) => d.id) })
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
        mandatoryCouldntComplete,
        openTasks,
        openBlockingDefects: blockingOpen.length,
        summary:
            reasons.length === 0
                ? `Room ${room.id} meets every readiness requirement.`
                : `Room ${room.id} cannot be marked Ready because ${joinReasons(reasons)}.`,
    }
}
