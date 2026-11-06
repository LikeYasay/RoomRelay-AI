import React, { useState } from 'react'
import { availableActions } from '../../domain/actions'
import type { RoomAction } from '../../domain/actions'
import { capitalizeFirst } from '../../domain/format'
import { CLEANING_LABEL, cleaningProgress } from '../../domain/progress'
import type { Role, RoomView, Staff } from '../../types/domain'
import { RoomStatusBadge } from '../../components/ui/Badge'
import { Banner } from '../../components/ui/Banner'
import { Dialog } from '../../components/ui/Dialog'
import { Icon } from '../../components/ui/Icon'

interface Props {
    view: RoomView
    role: Role
    user: Staff
}

/**
 * Shows why a room is or is not Ready and which actions the role may attempt.
 * Actions here are SIMULATIONS: they never change a ServiceNow record. Incomplete
 * actions are shown disabled with the reason, not as working buttons.
 */
export function ReadinessPanel({ view, role, user }: Props) {
    const { readiness, room } = view
    const cleaning = cleaningProgress(view)
    const actions = availableActions(view, role, user)
    const [active, setActive] = useState<RoomAction | null>(null)

    return (
        <section className="card" aria-labelledby="h-readiness">
            <h2 id="h-readiness">Readiness</h2>

            <dl className="facts">
                <div>
                    <dt>Cleaning progress</dt>
                    <dd>
                        {CLEANING_LABEL[cleaning.state]} ({cleaning.done}/{cleaning.total} mandatory tasks)
                    </dd>
                </div>
                <div>
                    <dt>Final readiness</dt>
                    <dd>
                        <RoomStatusBadge status={readiness.status} />
                    </dd>
                </div>
            </dl>

            {readiness.isReady ? (
                <Banner tone="info">{readiness.summary}</Banner>
            ) : (
                <div className="blocker-box" role="group" aria-label="Readiness blockers">
                    <p className="blocker-box__summary">
                        <Icon name="alert" size={18} /> {readiness.summary}
                    </p>
                    <ul className="blocker-box__list">
                        {readiness.blockers.map((b) => (
                            <li key={b.kind}>{capitalizeFirst(b.message)}</li>
                        ))}
                    </ul>
                </div>
            )}

            {actions.length > 0 ? (
                <div className="actions">
                    {actions.map((a) => {
                        const reasonId = `reason-${a.id}`
                        return (
                            <div key={a.id} className="actions__item">
                                <button
                                    type="button"
                                    className={`btn btn--primary${a.enabled ? '' : ' btn--disabled'}`}
                                    aria-disabled={!a.enabled}
                                    aria-describedby={a.enabled ? undefined : reasonId}
                                    onClick={() => a.enabled && setActive(a)}
                                >
                                    {a.label}
                                </button>
                                {a.enabled ? (
                                    <p className="muted actions__note">{a.description} (simulation only)</p>
                                ) : (
                                    <p id={reasonId} className="actions__note actions__note--blocked">
                                        <Icon name="lock" size={14} /> Not available: {a.reason}
                                    </p>
                                )}
                            </div>
                        )
                    })}
                </div>
            ) : readiness.isReady ? null : (
                <p className="muted">Your role cannot change this room&apos;s readiness.</p>
            )}

            {active ? <SimulationDialog action={active} roomId={room.id} onClose={() => setActive(null)} /> : null}
        </section>
    )
}

function SimulationDialog({ action, roomId, onClose }: { action: RoomAction; roomId: string; onClose: () => void }) {
    const [ran, setRan] = useState(false)

    return (
        <Dialog title={`${action.label}: Room ${roomId}`} onClose={onClose}>
            <Banner tone="warning">
                <strong>Simulation only.</strong> No ServiceNow record is read or changed.
            </Banner>
            {ran ? (
                <p className="dialog__body">
                    Simulated result: the request for Room {roomId} would be accepted by this screen. In the live
                    application the server re-checks your role, the room and every readiness rule, and may still refuse.
                </p>
            ) : (
                <p className="dialog__body">
                    {action.description} Run the simulation to see what the screen would do.
                </p>
            )}
            <div className="dialog__actions">
                {ran ? null : (
                    <button type="button" className="btn btn--primary" onClick={() => setRan(true)}>
                        Run simulation
                    </button>
                )}
                <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                    {ran ? 'Close' : 'Cancel'}
                </button>
            </div>
        </Dialog>
    )
}
