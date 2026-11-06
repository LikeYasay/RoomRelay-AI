import React, { useMemo } from 'react'
import { DataGate } from '../../shared/api/DataContext'
import type { ReadyData } from '../../shared/api/DataContext'
import { useSession } from '../auth/session'
import { formatDateTime } from '../../shared/lib/format'
import { INSPECTION_LABEL, SHIFT_LABEL } from '../../shared/domain/labels'
import { recentActivity } from '../activity/recentActivity'
import { Icon } from '../../shared/ui/Icon'
import { StateScreen } from '../../shared/ui/StateScreen'
import { ActivityFeed } from '../activity/ActivityFeed'
import { ChecklistPanel } from '../housekeeping/ChecklistPanel'
import { DefectsPanel } from './DefectsPanel'
import { ReadinessPanel } from './ReadinessPanel'

/** Room ids are 3 or 4 digits. Anything else is rejected before any lookup. */
export function isValidRoomId(value: string | undefined): value is string {
    return value !== undefined && /^\d{3,4}$/.test(value)
}

export function RoomDetailScreen({ roomId }: { roomId: string | undefined }) {
    return <DataGate loadingLabel="Loading room">{(data) => <RoomDetail data={data} roomId={roomId} />}</DataGate>
}

function BackLink() {
    return (
        <a className="back-link" href="#/rooms">
            <Icon name="arrow-left" size={16} /> Back to rooms
        </a>
    )
}

function RoomDetail({ data, roomId }: { data: ReadyData; roomId: string | undefined }) {
    const { role, user } = useSession()
    const { snapshot, scoped } = data

    const staffNames = useMemo(() => new Map(snapshot.staff.map((s) => [s.id, s.name])), [snapshot.staff])
    const view = isValidRoomId(roomId) ? scoped.views.find((v) => v.room.id === roomId) : undefined
    const timeline = useMemo(() => (view ? recentActivity([view], snapshot.audit, 30) : []), [view, snapshot.audit])

    if (!isValidRoomId(roomId)) {
        return (
            <StateScreen icon="search" tone="warning" title="Room not found" message="That is not a valid room number.">
                <a className="btn btn--primary" href="#/rooms">
                    Back to rooms
                </a>
            </StateScreen>
        )
    }

    if (!view) {
        // Deliberately the same message whether the room does not exist or is outside this role's scope,
        // so the screen never confirms that a room the user may not see exists.
        // (The server must apply the same rule: the real defence against IDOR/BOLA.)
        return (
            <StateScreen
                icon="lock"
                tone="danger"
                title="Room unavailable"
                message="This room does not exist or you do not have permission to view it."
            >
                <a className="btn btn--primary" href="#/rooms">
                    Back to rooms
                </a>
            </StateScreen>
        )
    }

    const { room, assignee, tasks, defects } = view

    return (
        <div className="stack">
            <BackLink />

            <div className="detail-grid">
                <div className="stack">
                    <ReadinessPanel view={view} role={role} user={user} />
                    <ChecklistPanel room={room} tasks={tasks} defects={defects} assignees={staffNames} />
                    <DefectsPanel view={view} data={data} />
                </div>

                <div className="stack">
                    <section className="card" aria-labelledby="h-info">
                        <h2 id="h-info">Room information</h2>
                        <dl className="facts facts--stacked">
                            <div>
                                <dt>Room</dt>
                                <dd>{room.id}</dd>
                            </div>
                            <div>
                                <dt>Floor</dt>
                                <dd>{room.floor}</dd>
                            </div>
                            <div>
                                <dt>Room type</dt>
                                <dd>{room.type}</dd>
                            </div>
                            <div>
                                <dt>Assigned housekeeper</dt>
                                <dd>
                                    {assignee ? `${assignee.name} (${SHIFT_LABEL[assignee.shift]})` : 'Unassigned'}
                                </dd>
                            </div>
                            <div>
                                <dt>Inspection</dt>
                                <dd>
                                    {INSPECTION_LABEL[room.inspection]}
                                    {room.inspectionAt ? (
                                        <span className="muted"> · {formatDateTime(room.inspectionAt)}</span>
                                    ) : null}
                                </dd>
                            </div>
                        </dl>
                    </section>

                    <section className="card" aria-labelledby="h-timeline">
                        <h2 id="h-timeline">Activity timeline</h2>
                        <ActivityFeed entries={timeline} nowIso={snapshot.generatedAt} showRoom={false} />
                    </section>
                </div>
            </div>
        </div>
    )
}
