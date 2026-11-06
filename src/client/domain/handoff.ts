import type { RoomView, Shift } from '../types/domain'
import { capitalizeFirst, plural } from './format'
import { SHIFT_LABEL } from './labels'
import { SHIFT_ORDER } from './selectors'

/**
 * SIMULATED shift briefing.
 *
 * This is built by a fixed local template from the data the user is already allowed
 * to see. It is NOT produced by an AI model, and the UI says so. In Phase 5 a real
 * model will write the narrative on the server from authorized, minimized data.
 * Either way the briefing is informational only and can never approve a room:
 * readiness is decided by deterministic rules, not by this text.
 */

export interface BriefingItem {
    roomId: string
    text: string
}

export interface Briefing {
    source: 'simulated'
    shift: Shift
    incomingShift: Shift
    generatedAt: string
    counts: { rooms: number; ready: number; blocked: number; pendingInspection: number; mandatoryOpen: number; unresolvedDefects: number; blockingDefects: number }
    summary: string
    priorities: BriefingItem[]
    blockedRooms: BriefingItem[]
    pendingInspections: BriefingItem[]
    outstandingTasks: BriefingItem[]
    unresolvedDefects: BriefingItem[]
    actions: string[]
}

const MAX_LIST = 8

export function nextShift(shift: Shift): Shift {
    const i = SHIFT_ORDER.indexOf(shift)
    return SHIFT_ORDER[(i + 1) % SHIFT_ORDER.length] as Shift
}

function roomList(ids: string[]): string {
    const shown = ids.slice(0, 6).join(', ')
    const list = ids.length > 6 ? `${shown} and ${ids.length - 6} more` : shown
    return `${ids.length === 1 ? 'Room' : 'Rooms'} ${list}`
}

export function buildSimulatedBriefing(views: RoomView[], shift: Shift, generatedAt: string): Briefing {
    const inShift = views.filter((v) => v.assignee?.shift === shift)
    const byStatus = (s: string) => inShift.filter((v) => v.readiness.status === s)

    const blocked = byStatus('blocked')
    const pending = byStatus('pending_inspection')
    const needsCleaning = byStatus('needs_cleaning')
    const inProgress = byStatus('in_progress')
    const ready = byStatus('ready')

    const openDefects = inShift.flatMap((v) => v.defects.filter((d) => d.status !== 'resolved').map((d) => ({ d, roomId: v.room.id })))
    const blockingDefects = openDefects.filter(({ d }) => d.blocking)
    const mandatoryOpen = inShift.reduce((n, v) => n + (v.readiness.mandatoryTotal - v.readiness.mandatoryDone), 0)

    const severityRank = { critical: 0, high: 1, medium: 2, low: 3 } as const

    // Critical priorities: high and critical blocking defects first, then failed inspections.
    const urgentRaw = blockingDefects
        .filter(({ d }) => d.severity === 'critical' || d.severity === 'high')
        .sort((a, b) => severityRank[a.d.severity] - severityRank[b.d.severity])
    const urgentDefects = urgentRaw.map(({ d, roomId }) => ({
        roomId,
        text: `${d.title} (${capitalizeFirst(d.severity)} severity, ${d.status === 'open' ? 'open' : 'in progress'}) is blocking readiness.`,
    }))
    const failed = inShift
        .filter((v) => v.room.inspection === 'failed')
        .map((v) => ({ roomId: v.room.id, text: 'Failed its last inspection and must be re-cleaned and re-inspected.' }))

    const summaryParts = [
        `${SHIFT_LABEL[shift]}: ${ready.length} of ${inShift.length} rooms are Ready.`,
        blocked.length > 0 ? `${plural(blocked.length, 'room')} ${blocked.length === 1 ? 'is' : 'are'} blocked.` : 'No rooms are blocked.',
        pending.length > 0 ? `${plural(pending.length, 'room')} ${pending.length === 1 ? 'is' : 'are'} waiting for inspection.` : null,
        `${plural(mandatoryOpen, 'mandatory task')} ${mandatoryOpen === 1 ? 'is' : 'are'} still outstanding and ${plural(openDefects.length, 'defect')} ${openDefects.length === 1 ? 'is' : 'are'} unresolved (${blockingDefects.length} blocking readiness).`,
    ].filter((p): p is string => p !== null)

    const actions: string[] = []
    for (const { d, roomId } of urgentRaw) {
        const owner = d.technicianId ? 'Follow up with the assigned technician on' : 'Assign a technician to'
        actions.push(`${owner} Room ${roomId}: ${d.title}.`)
    }
    if (failed.length > 0) actions.push(`Re-clean and resubmit for inspection: ${roomList(failed.map((f) => f.roomId))}.`)
    if (pending.length > 0) actions.push(`Complete inspections for ${roomList(pending.map((v) => v.room.id))}.`)
    if (inProgress.length > 0) actions.push(`Finish the remaining mandatory tasks in ${roomList(inProgress.map((v) => v.room.id))}.`)
    if (needsCleaning.length > 0) actions.push(`Start cleaning ${roomList(needsCleaning.map((v) => v.room.id))}.`)
    if (actions.length === 0) actions.push('No outstanding actions. All rooms for this shift are Ready.')

    return {
        source: 'simulated',
        shift,
        incomingShift: nextShift(shift),
        generatedAt,
        counts: {
            rooms: inShift.length,
            ready: ready.length,
            blocked: blocked.length,
            pendingInspection: pending.length,
            mandatoryOpen,
            unresolvedDefects: openDefects.length,
            blockingDefects: blockingDefects.length,
        },
        summary: summaryParts.join(' '),
        priorities: [...urgentDefects, ...failed].slice(0, 5),
        blockedRooms: blocked.slice(0, MAX_LIST).map((v) => ({
            roomId: v.room.id,
            text: v.readiness.blockers.map((b) => capitalizeFirst(b.message)).join('; ') + '.',
        })),
        pendingInspections: pending.slice(0, MAX_LIST).map((v) => ({ roomId: v.room.id, text: 'Cleaned and waiting for a supervisor inspection.' })),
        outstandingTasks: inShift
            .filter((v) => v.readiness.mandatoryTotal - v.readiness.mandatoryDone > 0)
            .sort((a, b) => b.readiness.mandatoryTotal - b.readiness.mandatoryDone - (a.readiness.mandatoryTotal - a.readiness.mandatoryDone))
            .slice(0, MAX_LIST)
            .map((v) => ({
                roomId: v.room.id,
                text: `${plural(v.readiness.mandatoryTotal - v.readiness.mandatoryDone, 'mandatory task')} outstanding${v.assignee ? ` (${v.assignee.name})` : ''}.`,
            })),
        unresolvedDefects: openDefects.slice(0, MAX_LIST).map(({ d, roomId }) => ({
            roomId,
            text: `${d.title}: ${capitalizeFirst(d.severity)} severity, ${d.blocking ? 'blocks readiness' : 'does not block readiness'}.`,
        })),
        actions,
    }
}

/** Plain-text version for copying. Strips control characters so pasted text is clean. */
export function briefingToText(b: Briefing): string {
    const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    const section = (title: string, items: BriefingItem[]) =>
        items.length === 0 ? [] : ['', `${title}`, ...items.map((i) => `- Room ${i.roomId}: ${clean(i.text)}`)]

    return [
        `RoomRelay AI shift handoff: ${SHIFT_LABEL[b.shift]} to ${SHIFT_LABEL[b.incomingShift]}`,
        `Generated: ${b.generatedAt}`,
        'Source: SIMULATED template (not generated by an AI model). Informational only; it does not approve rooms.',
        '',
        clean(b.summary),
        ...section('CRITICAL PRIORITIES', b.priorities),
        ...section('BLOCKED ROOMS', b.blockedRooms),
        ...section('PENDING INSPECTIONS', b.pendingInspections),
        ...section('OUTSTANDING MANDATORY TASKS', b.outstandingTasks),
        ...section('UNRESOLVED DEFECTS', b.unresolvedDefects),
        '',
        'SUGGESTED ACTIONS FOR INCOMING SHIFT',
        ...b.actions.map((a) => `- ${clean(a)}`),
    ].join('\n')
}
