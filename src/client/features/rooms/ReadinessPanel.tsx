import React, { useState } from 'react'
import { useCommands } from '../../shared/api/DataContext'
import type { Command } from '../../shared/api/commands'
import { RoomStatusBadge } from '../../shared/domain/StatusBadges'
import type { Role, RoomView, Staff } from '../../shared/domain/types'
import { capitalizeFirst } from '../../shared/lib/format'
import { Banner } from '../../shared/ui/Banner'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { Icon } from '../../shared/ui/Icon'
import { CLEANING_LABEL, cleaningProgress } from './progress'
import { availableActions } from './roomActions'
import type { RoomAction } from './roomActions'

interface Props {
    view: RoomView
    role: Role
    user: Staff
}

function commandFor(action: RoomAction, roomId: string): Command {
    if (action.id === 'submit_inspection') return { type: 'room.submitInspection', roomId }
    return { type: 'room.recordInspection', roomId, result: action.id === 'pass_inspection' ? 'passed' : 'failed' }
}

/**
 * Shows why a room is or is not Ready and which actions the role may take. Unavailable actions
 * are shown disabled with the reason, not as working buttons. The rule behind each button is
 * checked again when the action runs (and must be checked again by the server).
 */
export function ReadinessPanel({ view, role, user }: Props) {
    const { readiness, room } = view
    const { run } = useCommands()
    const cleaning = cleaningProgress(view)
    const actions = availableActions(view, role, user)
    const [active, setActive] = useState<RoomAction | null>(null)
    const [done, setDone] = useState<string | null>(null)

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

            {done ? (
                <div role="status">
                    <Banner tone="info">{done}</Banner>
                </div>
            ) : null}

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
                                    className={`btn ${a.secondary ? 'btn--ghost btn--flat' : 'btn--primary'}${a.enabled ? '' : ' btn--disabled'}`}
                                    aria-disabled={!a.enabled}
                                    aria-describedby={a.enabled ? undefined : reasonId}
                                    onClick={() => {
                                        if (!a.enabled) return
                                        setDone(null)
                                        setActive(a)
                                    }}
                                >
                                    {a.label}
                                </button>
                                {a.enabled ? (
                                    <p className="muted actions__note">{a.description}</p>
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

            {active ? (
                <ConfirmDialog
                    title={`${active.label}: Room ${room.id}`}
                    message={active.description}
                    confirmLabel={active.label}
                    onConfirm={async () => {
                        const outcome = await run(commandFor(active, room.id))
                        if (!outcome.ok) return outcome.message
                        setDone(
                            active.id === 'submit_inspection'
                                ? `Room ${room.id} was submitted for inspection.`
                                : active.id === 'pass_inspection'
                                  ? `Inspection passed. Room ${room.id} is Ready.`
                                  : `Inspection failed. Room ${room.id} is Blocked until it is re-cleaned and resubmitted.`
                        )
                        return undefined
                    }}
                    onClose={() => setActive(null)}
                />
            ) : null}
        </section>
    )
}
