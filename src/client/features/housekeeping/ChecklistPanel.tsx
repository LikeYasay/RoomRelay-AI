import React, { useState } from 'react'
import { useSession } from '../auth/session'
import { useCommands } from '../../shared/api/DataContext'
import { DEFECT_STATUS_META, INCOMPLETE_REASON_LABEL } from '../../shared/domain/labels'
import { TaskPriorityBadge, TaskStatusBadge } from '../../shared/domain/StatusBadges'
import type { Defect, HousekeepingTask, Room } from '../../shared/domain/types'
import { percent } from '../../shared/lib/format'
import { Banner } from '../../shared/ui/Banner'
import { CouldntCompleteDialog } from './CouldntCompleteDialog'

interface Props {
    room: Room
    tasks: HousekeepingTask[]
    defects: Defect[]
    assignees: Map<string, string>
}

type Notice = { tone: 'info' | 'danger'; text: string } | null

/**
 * The room's housekeeping checklist. The assigned housekeeper ticks tasks off, or marks one
 * "Couldn't Complete" with a reason. A supervisor can set a Couldn't Complete task back to Pending.
 */
export function ChecklistPanel({ room, tasks, defects, assignees }: Props) {
    const { role, user } = useSession()
    const { run } = useCommands()
    const [busyTask, setBusyTask] = useState<string | null>(null)
    const [incomplete, setIncomplete] = useState<HousekeepingTask | null>(null)
    const [notice, setNotice] = useState<Notice>(null)

    const isOwner = role === 'housekeeping' && room.assigneeId === user.id
    const canReopen = isOwner || role === 'supervisor'
    const awaitingInspection = room.inspection === 'pending'

    const mandatory = tasks.filter((t) => t.mandatory)
    const optional = tasks.filter((t) => !t.mandatory)
    const done = mandatory.filter((t) => t.status === 'completed').length

    const act = async (task: HousekeepingTask, type: 'task.complete' | 'task.reopen') => {
        if (busyTask) return
        setBusyTask(task.id)
        setNotice(null)
        const outcome = await run({ type, taskId: task.id })
        setBusyTask(null)
        if (!outcome.ok) setNotice({ tone: 'danger', text: outcome.message })
        else setNotice({ tone: 'info', text: type === 'task.complete' ? `Completed "${task.title}".` : `"${task.title}" is back to Pending.` })
    }

    const renderTask = (t: HousekeepingTask) => {
        const linked = t.linkedDefectId ? defects.find((d) => d.id === t.linkedDefectId) : undefined
        const waitingForRepair = t.status === 'couldnt_complete' && t.incompleteReason === 'needs_maintenance' && linked !== undefined && linked.status !== 'resolved'
        const busy = busyTask === t.id

        return (
            <li key={t.id} className={`checklist__item checklist__item--${t.status}`}>
                <div className="checklist__main">
                    {/* Task text is untrusted input; React renders it as plain text. */}
                    <p className="checklist__title">{t.title}</p>
                    <p className="muted checklist__desc">{t.description}</p>
                    <p className="muted checklist__meta">Assigned to {assignees.get(t.assigneeId) ?? 'Unassigned'}</p>

                    {t.status === 'couldnt_complete' && t.incompleteReason ? (
                        <p className="checklist__reason">
                            <strong>Reason:</strong> {INCOMPLETE_REASON_LABEL[t.incompleteReason]}
                            {t.incompleteNote ? <span className="preserve-lines"> · {t.incompleteNote}</span> : null}
                            {waitingForRepair && linked ? (
                                <span className="checklist__waiting">
                                    {' '}
                                    Waiting for maintenance (report {DEFECT_STATUS_META[linked.status].label.toLowerCase()}).
                                </span>
                            ) : null}
                        </p>
                    ) : null}
                    {t.status === 'pending' && t.repairNote ? (
                        <p className="checklist__repair">
                            <strong>Repair finished:</strong> <span className="preserve-lines">{t.repairNote}</span> Please re-check the
                            area and complete the task.
                        </p>
                    ) : null}

                    <div className="checklist__actions">
                        {isOwner && t.status === 'pending' ? (
                            <>
                                <button type="button" className="btn btn--primary btn--small" aria-disabled={busy} onClick={() => act(t, 'task.complete')}>
                                    {busy ? 'Saving...' : 'Mark completed'}
                                </button>
                                {awaitingInspection ? null : (
                                    <button type="button" className="btn btn--ghost btn--small btn--flat" onClick={() => setIncomplete(t)}>
                                        Couldn&apos;t complete...
                                    </button>
                                )}
                            </>
                        ) : null}
                        {canReopen && t.status === 'couldnt_complete' && !waitingForRepair ? (
                            <button type="button" className="btn btn--ghost btn--small btn--flat" aria-disabled={busy} onClick={() => act(t, 'task.reopen')}>
                                {busy ? 'Saving...' : 'Set back to Pending'}
                            </button>
                        ) : null}
                    </div>
                </div>
                <div className="checklist__badges">
                    <TaskStatusBadge status={t.status} />
                    {t.priority === 'high' ? <TaskPriorityBadge priority={t.priority} /> : null}
                </div>
            </li>
        )
    }

    return (
        <section className="card" aria-labelledby="h-checklist">
            <h2 id="h-checklist">Housekeeping checklist</h2>

            {notice ? (
                <div role="status">
                    <Banner tone={notice.tone}>{notice.text}</Banner>
                </div>
            ) : null}

            <div className="checklist__summary">
                <h3>Mandatory tasks</h3>
                <span className="muted">
                    {done} of {mandatory.length} completed
                </span>
            </div>
            <div
                className="progress"
                role="progressbar"
                aria-label="Mandatory tasks completed"
                aria-valuemin={0}
                aria-valuemax={mandatory.length}
                aria-valuenow={done}
                aria-valuetext={`${done} of ${mandatory.length} mandatory tasks completed`}
            >
                <span className="progress__fill progress__fill--teal" style={{ width: `${percent(done, mandatory.length)}%` }} />
            </div>
            {mandatory.length === 0 ? <p className="panel-empty">No mandatory tasks.</p> : <ul className="checklist">{mandatory.map(renderTask)}</ul>}

            <h3 className="checklist__optional-title">Optional tasks</h3>
            {optional.length === 0 ? (
                <p className="panel-empty">No optional tasks for this room.</p>
            ) : (
                <>
                    <p className="muted">Optional tasks never block readiness.</p>
                    <ul className="checklist">{optional.map(renderTask)}</ul>
                </>
            )}

            {incomplete ? (
                <CouldntCompleteDialog
                    task={incomplete}
                    onClose={() => setIncomplete(null)}
                    onDone={(message) => {
                        setIncomplete(null)
                        setNotice({ tone: 'info', text: message })
                    }}
                />
            ) : null}
        </section>
    )
}
