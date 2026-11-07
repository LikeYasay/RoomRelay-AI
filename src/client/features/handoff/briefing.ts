import type { Briefing, BriefingItem, RoomView, Shift } from '../../shared/domain/types.ts'
import { capitalizeFirst, plural } from '../../shared/lib/format.ts'
import { DEFECT_PRIORITY_META, DEFECT_STATUS_META, DEFECT_STATUS_ORDER, INCOMPLETE_REASON_LABEL, SHIFT_LABEL, SHIFT_ORDER } from '../../shared/domain/labels.ts'
import { isBlockingOpen } from '../maintenance/blockers.ts'

/**
 * The shift briefing.
 *
 * buildSimulatedBriefing is a fixed template over the data the user may see. It is always built:
 * its factual lists (blocked rooms, pending inspections, open tasks, defects) are what the screen
 * shows. Inside ServiceNow an AI model may then rewrite only the summary, priorities and actions
 * (aiBriefing.ts); if that fails the template is used and labeled as a fallback.
 * Either way the briefing is informational only and can never approve a room:
 * readiness is decided by deterministic rules, not by this text.
 */

export type { Briefing, BriefingItem, BriefingSource } from '../../shared/domain/types.ts'

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
    const blockingDefects = openDefects.filter(({ d }) => isBlockingOpen(d))
    const newReports = openDefects.filter(({ d }) => d.status === 'new')
    const incomplete = inShift.flatMap((v) => v.tasks.filter((t) => t.status === 'couldnt_complete').map((t) => ({ t, roomId: v.room.id })))
    const mandatoryOpen = inShift.reduce((n, v) => n + (v.readiness.mandatoryTotal - v.readiness.mandatoryDone), 0)

    // Top priorities: Blocking defects first (unassigned before assigned), then failed inspections.
    const urgentRaw = [...blockingDefects].sort((a, b) => DEFECT_STATUS_ORDER.indexOf(a.d.status) - DEFECT_STATUS_ORDER.indexOf(b.d.status))
    const urgentDefects = urgentRaw.map(({ d, roomId }) => ({
        roomId,
        text: `${d.title} (Blocking, ${DEFECT_STATUS_META[d.status].label.toLowerCase()}) is stopping the room from being Ready.`,
    }))
    const failed = inShift
        .filter((v) => v.room.inspection === 'failed')
        .map((v) => ({ roomId: v.room.id, text: 'Failed its last inspection and must be re-cleaned and re-inspected.' }))

    const summaryParts = [
        `${SHIFT_LABEL[shift]}: ${ready.length} of ${inShift.length} rooms are Ready.`,
        blocked.length > 0 ? `${plural(blocked.length, 'room')} ${blocked.length === 1 ? 'is' : 'are'} blocked.` : 'No rooms are blocked.',
        pending.length > 0 ? `${plural(pending.length, 'room')} ${pending.length === 1 ? 'is' : 'are'} waiting for inspection.` : null,
        `${plural(mandatoryOpen, 'mandatory task')} ${mandatoryOpen === 1 ? 'is' : 'are'} still outstanding and ${plural(openDefects.length, 'defect')} ${openDefects.length === 1 ? 'is' : 'are'} unresolved (${blockingDefects.length} blocking readiness).`,
        incomplete.length > 0 ? `${plural(incomplete.length, 'task')} could not be completed.` : null,
    ].filter((p): p is string => p !== null)

    const actions: string[] = []
    for (const { d, roomId } of urgentRaw) {
        const owner = d.technicianId ? 'Follow up with the assigned technician on' : 'Assign a technician to'
        actions.push(`${owner} Room ${roomId}: ${d.title}.`)
    }
    if (newReports.length > 0) actions.push(`Triage new maintenance reports (assign a technician and set the priority) for ${roomList([...new Set(newReports.map((n) => n.roomId))])}.`)
    if (incomplete.length > 0) actions.push(`Follow up on tasks that could not be completed in ${roomList([...new Set(incomplete.map((i) => i.roomId))])}.`)
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
            couldntComplete: incomplete.length,
            unresolvedDefects: openDefects.length,
            blockingDefects: blockingDefects.length,
            awaitingTriage: newReports.length,
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
        couldntComplete: incomplete.slice(0, MAX_LIST).map(({ t, roomId }) => ({
            roomId,
            text: `${t.title}: could not be completed (${t.incompleteReason ? INCOMPLETE_REASON_LABEL[t.incompleteReason] : 'no reason given'}).`,
        })),
        awaitingTriage: newReports.slice(0, MAX_LIST).map(({ d, roomId }) => ({ roomId, text: `${d.title}: reported, not yet assigned to a technician.` })),
        unresolvedDefects: openDefects.slice(0, MAX_LIST).map(({ d, roomId }) => ({
            roomId,
            text: `${d.title}: ${DEFECT_PRIORITY_META[d.priority].label} priority, ${DEFECT_STATUS_META[d.status].label.toLowerCase()}${d.priority === 'blocking' ? ', blocks readiness' : ''}.`,
        })),
        actions,
    }
}

function sourceLine(b: Briefing): string {
    if (b.source === 'ai') return `AI summary (${b.model ?? 'AI model'}); the room lists come from the readiness rules.`
    if (b.source === 'fallback') return `FALLBACK template, not AI (${b.fallbackReason ?? 'the AI service was unavailable'}).`
    return 'SIMULATED template (not generated by an AI model).'
}

/** Plain-text version for copying. Strips control characters so pasted text is clean. */
export function briefingToText(b: Briefing): string {
    const clean = (s: string) => s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
    const section = (title: string, items: BriefingItem[]) =>
        items.length === 0 ? [] : ['', `${title}`, ...items.map((i) => `- Room ${i.roomId}: ${clean(i.text)}`)]

    return [
        `RoomRelay AI shift handoff: ${SHIFT_LABEL[b.shift]} to ${SHIFT_LABEL[b.incomingShift]}`,
        `Generated: ${b.generatedAt}`,
        `Source: ${sourceLine(b)} Informational only; it does not approve rooms.`,
        '',
        clean(b.summary),
        ...section('TOP PRIORITIES', b.priorities),
        ...section('BLOCKED ROOMS', b.blockedRooms),
        ...section('PENDING INSPECTIONS', b.pendingInspections),
        ...section('OUTSTANDING MANDATORY TASKS', b.outstandingTasks),
        ...section("TASKS THAT COULDN'T BE COMPLETED", b.couldntComplete),
        ...section('REPORTS AWAITING TRIAGE', b.awaitingTriage),
        ...section('UNRESOLVED DEFECTS', b.unresolvedDefects),
        '',
        'SUGGESTED ACTIONS FOR INCOMING SHIFT',
        ...b.actions.map((a) => `- ${clean(a)}`),
    ].join('\n')
}
