import type { AuditEntry, RoomView } from '../../shared/domain/types.ts'

/**
 * Recent activity for the rooms in view, newest first. It reads the same audit log the
 * administrator sees, so the feed and the log can never disagree.
 */
export function recentActivity(views: RoomView[], audit: AuditEntry[], limit = 8): AuditEntry[] {
    const roomIds = new Set(views.map((v) => v.room.id))
    return audit
        .filter((e) => e.roomId !== undefined && roomIds.has(e.roomId))
        .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))
        .slice(0, limit)
}
