import type { Defect, Role, RoomView, Staff } from '../types/domain'

/**
 * Narrows the rooms a role sees (least privilege, demo version).
 *
 * PROTOTYPE NOTE: in the real application the server must only RETURN records the
 * user may see (ACLs / GlideRecordSecure). Filtering in the browser is cosmetic and
 * must never be relied on, because a client can always call the API directly.
 */
export function scopeViewsForRole(views: RoomView[], role: Role, user: Staff): { views: RoomView[]; note: string } {
    switch (role) {
        case 'housekeeping':
            return {
                views: views.filter((v) => v.room.assigneeId === user.id),
                note: 'Showing only the rooms assigned to you.',
            }
        case 'maintenance':
            return {
                views: views.filter((v) => v.defects.some((d) => d.technicianId === user.id)),
                note: 'Showing only rooms with defects assigned to you.',
            }
        default:
            return { views, note: 'Showing all rooms.' }
    }
}

export interface DefectRow {
    defect: Defect
    view: RoomView
}

/** Defects a role may see in the Maintenance screen (demo-level scoping). */
export function scopeDefectsForRole(views: RoomView[], role: Role, user: Staff): { rows: DefectRow[]; note: string } {
    const rows = views.flatMap((view) => view.defects.map((defect) => ({ defect, view })))
    if (role === 'maintenance') {
        return { rows: rows.filter((r) => r.defect.technicianId === user.id), note: 'Showing only defects assigned to you.' }
    }
    if (role === 'housekeeping') {
        return { rows, note: 'Showing defects in your assigned rooms.' }
    }
    return { rows, note: 'Showing all defects.' }
}
