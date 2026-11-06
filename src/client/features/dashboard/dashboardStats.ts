import { SHIFT_ORDER } from '../../shared/domain/labels'
import type { RoomStatus, RoomView, Shift, Staff } from '../../shared/domain/types'
import { isBlockingOpen } from '../maintenance/blockers'
import { countByStatus } from '../rooms/roomViews'

/** Dashboard numbers. All of them are derived from the same room views, so they always agree. */

export interface Kpis {
    totalRooms: number
    byStatus: Record<RoomStatus, number>
    readyPercent: number
    openTasks: number
    openMandatoryTasks: number
    couldntComplete: number
    unresolvedDefects: number
    blockingDefects: number
    awaitingTriage: number
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
        openTasks: tasks.filter((t) => t.status !== 'completed').length,
        openMandatoryTasks: tasks.filter((t) => t.mandatory && t.status !== 'completed').length,
        couldntComplete: tasks.filter((t) => t.status === 'couldnt_complete').length,
        unresolvedDefects: unresolved.length,
        blockingDefects: defects.filter(isBlockingOpen).length,
        awaitingTriage: defects.filter((d) => d.status === 'new').length,
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
