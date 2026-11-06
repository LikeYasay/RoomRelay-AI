import React from 'react'
import { cleaningProgress, CLEANING_LABEL } from './progress'
import { INSPECTION_LABEL } from '../../shared/domain/labels'
import { percent, plural } from '../../shared/lib/format'
import type { RoomView } from '../../shared/domain/types'
import { RoomStatusBadge, TaskPriorityBadge, TaskStatusBadge } from '../../shared/domain/StatusBadges'

/** Card view of one room. Cleaning progress and final readiness are shown separately on purpose. */
export function RoomCard({ view }: { view: RoomView }) {
    const { room, readiness, assignee } = view
    const cleaning = cleaningProgress(view)
    const pct = percent(cleaning.done, cleaning.total)

    return (
        <li className={`room-card room-card--${readiness.status}`}>
            <div className="room-card__head">
                <a className="room-card__number" href={`#/rooms/${encodeURIComponent(room.id)}`}>
                    <span className="sr-only">Open details for room </span>
                    {room.id}
                </a>
                <RoomStatusBadge status={readiness.status} />
            </div>
            <p className="muted">
                Floor {room.floor} · {room.type}
            </p>

            <dl className="room-card__facts">
                <div>
                    <dt>Cleaning</dt>
                    <dd>
                        {CLEANING_LABEL[cleaning.state]} ({cleaning.done}/{cleaning.total})
                    </dd>
                </div>
                <div>
                    <dt>Inspection</dt>
                    <dd>{INSPECTION_LABEL[room.inspection]}</dd>
                </div>
            </dl>

            <div
                className="progress"
                role="progressbar"
                aria-label={`Room ${room.id} mandatory cleaning tasks`}
                aria-valuemin={0}
                aria-valuemax={cleaning.total}
                aria-valuenow={cleaning.done}
                aria-valuetext={`${cleaning.done} of ${cleaning.total} mandatory tasks done`}
            >
                <span className="progress__fill progress__fill--teal" style={{ width: `${pct}%` }} />
            </div>

            <p className="room-card__counts">
                {plural(readiness.openTasks, 'open task')} · {plural(readiness.openBlockingDefects, 'blocking defect')}
            </p>
            {view.priority === 'high' || readiness.mandatoryCouldntComplete > 0 ? (
                <p className="badge-row">
                    {view.priority === 'high' ? <TaskPriorityBadge priority="high" /> : null}
                    {readiness.mandatoryCouldntComplete > 0 ? <TaskStatusBadge status="couldnt_complete" /> : null}
                </p>
            ) : null}
            <p className="muted room-card__assignee">{assignee?.name ?? 'Unassigned'}</p>
        </li>
    )
}
