import type { Role, RoomView, Snapshot, Staff } from '../../shared/domain/types'
import { buildRoomViews } from './roomViews'

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

/**
 * The part of the dataset a user may receive at all. The server calls this before sending
 * anything (and the demo data source does the same), so the browser never gets other people's rooms.
 *   - rooms, and their tasks and defects: the rooms scopeViewsForRole allows
 *   - audit entries: everything for the administrator; otherwise only entries about those rooms
 *   - staff: names, roles and shifts of everyone (needed to show who did what)
 */
export function scopeSnapshotForRole(snapshot: Snapshot, role: Role, user: Staff): Snapshot {
    const visible = new Set(scopeViewsForRole(buildRoomViews(snapshot), role, user).views.map((v) => v.room.id))
    return {
        ...snapshot,
        rooms: snapshot.rooms.filter((r) => visible.has(r.id)),
        tasks: snapshot.tasks.filter((t) => visible.has(t.roomId)),
        defects: snapshot.defects.filter((d) => visible.has(d.roomId)),
        audit: role === 'admin' ? snapshot.audit : snapshot.audit.filter((e) => e.roomId !== undefined && visible.has(e.roomId)),
    }
}
