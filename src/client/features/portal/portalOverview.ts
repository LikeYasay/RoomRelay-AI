import { DEFECT_PRIORITY_META, DEFECT_STATUS_META, ROLE_LABEL, ROOM_STATUS_META } from '../../shared/domain/labels.ts'
import type { Role, RoomStatus, RoomView, Snapshot, Staff } from '../../shared/domain/types.ts'
import { plural } from '../../shared/lib/format.ts'
import type { Tone } from '../../shared/ui/tone.ts'
import { reportableRoomIds } from '../maintenance/defectCommands.ts'
import { buildRoomViews, countByStatus, priorityRank, STATUS_ORDER } from '../rooms/roomViews.ts'
import { scopeViewsForRole } from '../rooms/scope.ts'

/**
 * What the RoomRelay Service Portal widgets show (GET /portal/overview).
 *
 * The server builds it from a snapshot that is already limited to what the caller may see
 * (scopeSnapshotForRole), using the same readiness rules as the main app. The widgets only
 * display it: they never work out a room's status themselves.
 */

export type PortalTone = Tone

export interface PortalStatusCount {
    status: RoomStatus
    label: string
    tone: PortalTone
    count: number
}

export interface PortalBlockedRoom {
    roomId: string
    floor: number
    /** The readiness rule's own sentence, for example "Room 305 cannot be marked Ready because ...". */
    reason: string
}

export interface PortalWorkItem {
    roomId: string
    title: string
    detail: string
    tag: string
    tone: PortalTone
}

export interface PortalOverview {
    user: { name: string; role: Role; roleLabel: string }
    /** `scopeNote` says which rooms the numbers cover, for example "Showing only the rooms assigned to you." */
    totals: { rooms: number; ready: number; readyPercent: number; scopeNote: string; byStatus: PortalStatusCount[] }
    blockedRooms: PortalBlockedRoom[]
    myWork: { title: string; note: string; emptyText: string; items: PortalWorkItem[] }
    report: { allowed: boolean; rooms: { id: string; label: string }[] }
    generatedAt: string
}

/** The longest lists the widgets show; the full app has the rest. */
export const PORTAL_LIST_LIMIT = 8

function roomLabel(view: RoomView): string {
    return `Room ${view.room.id} (floor ${view.room.floor})`
}

function housekeepingWork(views: RoomView[], user: Staff): PortalWorkItem[] {
    return views
        .filter((v) => v.room.assigneeId === user.id && !v.readiness.isReady)
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || a.room.id.localeCompare(b.room.id, undefined, { numeric: true }))
        .map((v) => {
            const left = v.readiness.mandatoryTotal - v.readiness.mandatoryDone
            const meta = ROOM_STATUS_META[v.readiness.status]
            return {
                roomId: v.room.id,
                title: roomLabel(v),
                detail:
                    left > 0
                        ? `${plural(left, 'mandatory task')} left of ${v.readiness.mandatoryTotal}`
                        : v.readiness.status === 'blocked'
                          ? v.readiness.summary
                          : 'Checklist done. Waiting for inspection.',
                tag: meta.label,
                tone: meta.tone,
            }
        })
}

function maintenanceWork(views: RoomView[], user: Staff): PortalWorkItem[] {
    return views
        .flatMap((v) => v.defects.filter((d) => d.technicianId === user.id && d.status !== 'resolved').map((d) => ({ v, d })))
        .sort(
            (a, b) =>
                (a.d.priority === 'blocking' ? 0 : 1) - (b.d.priority === 'blocking' ? 0 : 1) || a.d.reportedAt.localeCompare(b.d.reportedAt)
        )
        .map(({ v, d }) => ({
            roomId: v.room.id,
            title: `${roomLabel(v)}: ${d.title}`,
            detail: `${DEFECT_PRIORITY_META[d.priority].label} priority, ${DEFECT_STATUS_META[d.status].label.toLowerCase()}`,
            tag: DEFECT_STATUS_META[d.status].label,
            tone: d.priority === 'blocking' ? 'danger' : DEFECT_STATUS_META[d.status].tone,
        }))
}

/** Supervisor and administrator: rooms to inspect, then defects nobody has triaged yet. */
function oversightWork(views: RoomView[]): PortalWorkItem[] {
    const inspections: PortalWorkItem[] = views
        .filter((v) => v.readiness.status === 'pending_inspection' && v.room.inspection === 'pending')
        .map((v) => ({
            roomId: v.room.id,
            title: roomLabel(v),
            detail: 'Checklist done. Inspection requested.',
            tag: 'Inspect',
            tone: 'review',
        }))
    const triage: PortalWorkItem[] = views
        .flatMap((v) => v.defects.filter((d) => d.status === 'new').map((d) => ({ v, d })))
        .sort((a, b) => a.d.reportedAt.localeCompare(b.d.reportedAt))
        .map(({ v, d }) => ({
            roomId: v.room.id,
            title: `${roomLabel(v)}: ${d.title}`,
            detail: 'New defect. Needs a technician and a priority.',
            tag: 'Triage',
            tone: 'warning',
        }))
    return [...inspections, ...triage]
}

const MY_WORK_TEXT: Record<Role, { title: string; note: string; emptyText: string }> = {
    housekeeping: {
        title: 'My rooms',
        note: 'Your assigned rooms that are not Ready yet, highest task priority first.',
        emptyText: 'All your rooms are Ready.',
    },
    maintenance: {
        title: 'My repairs',
        note: 'Open defects assigned to you, Blocking first.',
        emptyText: 'No open repairs are assigned to you.',
    },
    supervisor: {
        title: 'Needs my attention',
        note: 'Rooms waiting for inspection, then new defects to triage.',
        emptyText: 'No inspections or new defects are waiting.',
    },
    admin: {
        title: 'Waiting on the team',
        note: 'Rooms waiting for inspection and new defects not triaged yet (view only).',
        emptyText: 'No inspections or new defects are waiting.',
    },
}

/**
 * Builds the portal overview for one caller. `snapshot` must already be scoped to the caller's
 * role; the report room list comes from the same rule the defect command enforces.
 */
export function buildPortalOverview(snapshot: Snapshot, user: Staff): PortalOverview {
    const views = buildRoomViews(snapshot)
    const counts = countByStatus(views)
    const byStatus = STATUS_ORDER.map((status) => ({
        status,
        label: ROOM_STATUS_META[status].label,
        tone: ROOM_STATUS_META[status].tone,
        count: counts[status],
    }))

    const blockedRooms = views
        .filter((v) => v.readiness.status === 'blocked')
        .map((v) => ({ roomId: v.room.id, floor: v.room.floor, reason: v.readiness.summary }))
        .slice(0, PORTAL_LIST_LIMIT)

    const work =
        user.role === 'housekeeping'
            ? housekeepingWork(views, user)
            : user.role === 'maintenance'
              ? maintenanceWork(views, user)
              : oversightWork(views)

    const reportIds = new Set(reportableRoomIds(snapshot, { actor: user, now: snapshot.generatedAt }))
    const reportRooms = views.filter((v) => reportIds.has(v.room.id)).map((v) => ({ id: v.room.id, label: roomLabel(v) }))

    return {
        user: { name: user.name, role: user.role, roleLabel: ROLE_LABEL[user.role] },
        totals: {
            rooms: views.length,
            ready: counts.ready,
            readyPercent: views.length === 0 ? 0 : Math.round((counts.ready / views.length) * 100),
            scopeNote: scopeViewsForRole(views, user.role, user).note,
            byStatus,
        },
        blockedRooms,
        myWork: { ...MY_WORK_TEXT[user.role], items: work.slice(0, PORTAL_LIST_LIMIT) },
        report: { allowed: user.role === 'housekeeping' || user.role === 'supervisor', rooms: reportRooms },
        generatedAt: snapshot.generatedAt,
    }
}
