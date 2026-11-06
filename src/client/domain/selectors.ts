import type {
    ActivityEntry,
    Defect,
    RoomStatus,
    RoomView,
    Shift,
    Snapshot,
    Staff,
} from '../types/domain'
import { evaluateReadiness } from './readiness'

/** Join raw records into per-room views. Every dashboard number is derived from these. */
export function buildRoomViews(snapshot: Snapshot): RoomView[] {
    const staffById = new Map(snapshot.staff.map((s) => [s.id, s]))
    return snapshot.rooms
        .map((room) => {
            const tasks = snapshot.tasks.filter((t) => t.roomId === room.id)
            const defects = snapshot.defects.filter((d) => d.roomId === room.id)
            return {
                room,
                tasks,
                defects,
                assignee: staffById.get(room.assigneeId),
                readiness: evaluateReadiness(room, tasks, defects),
            }
        })
        .sort((a, b) => a.room.id.localeCompare(b.room.id, undefined, { numeric: true }))
}

export const STATUS_ORDER: RoomStatus[] = ['ready', 'needs_cleaning', 'in_progress', 'pending_inspection', 'blocked']

export function countByStatus(views: RoomView[]): Record<RoomStatus, number> {
    const counts: Record<RoomStatus, number> = {
        ready: 0,
        needs_cleaning: 0,
        in_progress: 0,
        pending_inspection: 0,
        blocked: 0,
    }
    for (const v of views) counts[v.readiness.status] += 1
    return counts
}

export function isHighPriorityBlocker(d: Defect): boolean {
    return d.blocking && d.status !== 'resolved' && (d.severity === 'high' || d.severity === 'critical')
}

export interface Kpis {
    totalRooms: number
    byStatus: Record<RoomStatus, number>
    readyPercent: number
    openTasks: number
    openMandatoryTasks: number
    unresolvedDefects: number
    unresolvedBlockingDefects: number
    highPriorityBlockers: number
}

export function computeKpis(views: RoomView[]): Kpis {
    const byStatus = countByStatus(views)
    const tasks = views.flatMap((v) => v.tasks)
    const defects = views.flatMap((v) => v.defects)
    const unresolved = defects.filter((d) => d.status !== 'resolved')

    return {
        totalRooms: views.length,
        byStatus,
        readyPercent: views.length === 0 ? 0 : Math.round((byStatus.ready / views.length) * 100),
        openTasks: tasks.filter((t) => t.status !== 'done').length,
        openMandatoryTasks: tasks.filter((t) => t.mandatory && t.status !== 'done').length,
        unresolvedDefects: unresolved.length,
        unresolvedBlockingDefects: unresolved.filter((d) => d.blocking).length,
        highPriorityBlockers: defects.filter(isHighPriorityBlocker).length,
    }
}

export interface FloorBreakdown {
    floor: number
    total: number
    byStatus: Record<RoomStatus, number>
}

export function floorBreakdown(views: RoomView[]): FloorBreakdown[] {
    const floors = [...new Set(views.map((v) => v.room.floor))].sort((a, b) => a - b)
    return floors.map((floor) => {
        const inFloor = views.filter((v) => v.room.floor === floor)
        return { floor, total: inFloor.length, byStatus: countByStatus(inFloor) }
    })
}

export interface ShiftSummary {
    shift: Shift
    staff: Staff[]
    totalRooms: number
    readyRooms: number
    openTasks: number
    unresolvedDefects: number
}

export const SHIFT_ORDER: Shift[] = ['morning', 'afternoon', 'night']

/** A room belongs to the shift of the housekeeper it is assigned to. */
export function shiftOverview(views: RoomView[], staff: Staff[]): ShiftSummary[] {
    return SHIFT_ORDER.map((shift) => {
        const inShift = views.filter((v) => v.assignee?.shift === shift)
        const staffIds = new Set(inShift.map((v) => v.room.assigneeId))
        return {
            shift,
            staff: staff.filter((s) => staffIds.has(s.id)),
            totalRooms: inShift.length,
            readyRooms: inShift.filter((v) => v.readiness.isReady).length,
            openTasks: inShift.reduce((n, v) => n + v.readiness.openTasks, 0),
            unresolvedDefects: inShift.reduce((n, v) => n + v.defects.filter((d) => d.status !== 'resolved').length, 0),
        }
    }).filter((s) => s.totalRooms > 0)
}

export interface PriorityBlocker {
    defect: Defect
    roomId: string
    technician: Staff | undefined
}

export function highPriorityBlockers(views: RoomView[], staff: Staff[]): PriorityBlocker[] {
    const staffById = new Map(staff.map((s) => [s.id, s]))
    const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const
    return views
        .flatMap((v) => v.defects.filter(isHighPriorityBlocker))
        .sort((a, b) => rank[a.severity] - rank[b.severity] || a.reportedAt.localeCompare(b.reportedAt))
        .map((defect) => ({
            defect,
            roomId: defect.roomId,
            technician: defect.technicianId ? staffById.get(defect.technicianId) : undefined,
        }))
}

/** Recent activity is derived from timestamps on the underlying records, so it always matches the data. */
export function recentActivity(views: RoomView[], staff: Staff[], limit = 8): ActivityEntry[] {
    const staffById = new Map(staff.map((s) => [s.id, s]))
    const entries: ActivityEntry[] = []

    for (const v of views) {
        const room = v.room
        for (const t of v.tasks) {
            if (t.status === 'done' && t.completedAt) {
                const who = staffById.get(t.assigneeId)?.name ?? 'Staff'
                entries.push({
                    id: `a-${t.id}`,
                    at: t.completedAt,
                    roomId: room.id,
                    kind: 'task_completed',
                    text: `${who} completed "${t.title}"`,
                })
            }
        }
        for (const d of v.defects) {
            entries.push({
                id: `a-${d.id}-rep`,
                at: d.reportedAt,
                roomId: room.id,
                kind: 'defect_reported',
                text: `Defect reported: ${d.title}`,
            })
            if (d.status === 'resolved' && d.resolvedAt) {
                entries.push({
                    id: `a-${d.id}-res`,
                    at: d.resolvedAt,
                    roomId: room.id,
                    kind: 'defect_resolved',
                    text: `Defect resolved: ${d.title}`,
                })
            }
        }
        if (room.inspectionAt && (room.inspection === 'passed' || room.inspection === 'failed')) {
            entries.push({
                id: `a-${room.id}-insp`,
                at: room.inspectionAt,
                roomId: room.id,
                kind: room.inspection === 'passed' ? 'inspection_passed' : 'inspection_failed',
                text: room.inspection === 'passed' ? 'Inspection passed' : 'Inspection failed',
            })
        }
    }

    return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit)
}
