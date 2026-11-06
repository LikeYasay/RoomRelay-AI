import React from 'react'
import { AUDIT_ACTION_META } from '../../shared/domain/labels'
import type { AuditEntry } from '../../shared/domain/types'
import { formatAgo } from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'

interface ActivityFeedProps {
    entries: AuditEntry[]
    nowIso: string
    /** Hide the room prefix when the feed is already scoped to a single room. */
    showRoom?: boolean
}

/** Recent changes, newest first. The text is built by the system and rendered as plain text. */
export function ActivityFeed({ entries, nowIso, showRoom = true }: ActivityFeedProps) {
    if (entries.length === 0) {
        return <p className="panel-empty">No recent activity.</p>
    }
    return (
        <ol className="activity">
            {entries.map((e) => (
                <li key={e.id} className="activity__item">
                    <span className="activity__icon">
                        <Icon name={AUDIT_ACTION_META[e.action].icon} size={16} />
                    </span>
                    <div>
                        <p className="activity__text">
                            {showRoom && e.roomId ? (
                                <>
                                    <a className="link" href={`#/rooms/${encodeURIComponent(e.roomId)}`}>
                                        Room {e.roomId}
                                    </a>
                                    :{' '}
                                </>
                            ) : null}
                            {e.summary}
                        </p>
                        <p className="muted activity__time">{formatAgo(e.at, nowIso)}</p>
                    </div>
                </li>
            ))}
        </ol>
    )
}
