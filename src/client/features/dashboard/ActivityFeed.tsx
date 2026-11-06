import React from 'react'
import { formatAgo } from '../../domain/format'
import type { ActivityEntry } from '../../types/domain'
import { Icon } from '../../components/ui/Icon'
import type { IconName } from '../../components/ui/Icon'

const ICONS: Record<ActivityEntry['kind'], IconName> = {
    task_completed: 'check-circle',
    defect_reported: 'alert',
    defect_resolved: 'wrench',
    inspection_passed: 'clipboard-check',
    inspection_failed: 'alert-small',
}

interface ActivityFeedProps {
    entries: ActivityEntry[]
    nowIso: string
    /** Hide the room prefix when the feed is already scoped to a single room. */
    showRoom?: boolean
}

export function ActivityFeed({ entries, nowIso, showRoom = true }: ActivityFeedProps) {
    if (entries.length === 0) {
        return <p className="panel-empty">No recent activity.</p>
    }
    return (
        <ol className="activity">
            {entries.map((e) => (
                <li key={e.id} className="activity__item">
                    <span className="activity__icon">
                        <Icon name={ICONS[e.kind]} size={16} />
                    </span>
                    <div>
                        <p className="activity__text">
                            {showRoom ? (
                                <>
                                    <a className="link" href={`#/rooms/${encodeURIComponent(e.roomId)}`}>
                                        Room {e.roomId}
                                    </a>
                                    :{' '}
                                </>
                            ) : null}
                            {e.text}
                        </p>
                        <p className="muted activity__time">{formatAgo(e.at, nowIso)}</p>
                    </div>
                </li>
            ))}
        </ol>
    )
}
