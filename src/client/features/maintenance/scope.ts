import type { Defect, Role, RoomView, Staff } from '../../shared/domain/types.ts'

/**
 * Which defects a role sees on the Maintenance page. The server has already limited the
 * data to the role's rooms; this narrows it further for technicians (only their own defects).
 */

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
