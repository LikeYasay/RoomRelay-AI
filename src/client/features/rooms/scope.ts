import type { Role, RoomView, Staff } from '../../shared/domain/types'

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
