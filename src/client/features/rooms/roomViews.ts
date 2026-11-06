import { TASK_PRIORITY_ORDER } from '../../shared/domain/labels'
import type { HousekeepingTask, RoomStatus, RoomView, Snapshot, TaskPriority } from '../../shared/domain/types'
import { evaluateReadiness } from './readiness'

/**
 * Room priority = the highest priority among the room's open (not Completed) tasks.
 * It is not stored anywhere and only decides sort order. It never affects readiness.
 */
export function roomPriority(tasks: HousekeepingTask[]): TaskPriority | undefined {
    const open = tasks.filter((t) => t.status !== 'completed')
    return TASK_PRIORITY_ORDER.find((p) => open.some((t) => t.priority === p))
}

/** 0 = high ... 3 = nothing open. Lower sorts first. */
export function priorityRank(priority: TaskPriority | undefined): number {
    return priority === undefined ? TASK_PRIORITY_ORDER.length : TASK_PRIORITY_ORDER.indexOf(priority)
}

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
                priority: roomPriority(tasks),
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
