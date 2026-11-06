import { DEFECT_STATUS_ORDER } from '../../shared/domain/labels'
import type { Defect, RoomView, Staff } from '../../shared/domain/types'

/** Only an unresolved defect with priority Blocking stops a room from being Ready. */
export function isBlockingOpen(d: Defect): boolean {
    return d.priority === 'blocking' && d.status !== 'resolved'
}

export interface BlockingDefect {
    defect: Defect
    roomId: string
    technician: Staff | undefined
}

/** Unresolved Blocking defects: unassigned first, then by status, then oldest first. */
export function blockingDefects(views: RoomView[], staff: Staff[]): BlockingDefect[] {
    const staffById = new Map(staff.map((s) => [s.id, s]))
    return views
        .flatMap((v) => v.defects.filter(isBlockingOpen))
        .sort(
            (a, b) =>
                DEFECT_STATUS_ORDER.indexOf(a.status) - DEFECT_STATUS_ORDER.indexOf(b.status) ||
                a.reportedAt.localeCompare(b.reportedAt)
        )
        .map((defect) => ({
            defect,
            roomId: defect.roomId,
            technician: defect.technicianId ? staffById.get(defect.technicianId) : undefined,
        }))
}
