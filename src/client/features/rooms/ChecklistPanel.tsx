import React from 'react'
import { percent } from '../../domain/format'
import type { HousekeepingTask } from '../../types/domain'
import { PriorityBadge, ReviewBadge, TaskStatusBadge } from '../../components/ui/Badge'

function TaskList({ tasks, assignees }: { tasks: HousekeepingTask[]; assignees: Map<string, string> }) {
    return (
        <ul className="checklist">
            {tasks.map((t) => (
                <li key={t.id} className={`checklist__item${t.status === 'done' ? ' checklist__item--done' : ''}`}>
                    <div className="checklist__main">
                        {/* Task text is untrusted input; React renders it as plain text. */}
                        <p className="checklist__title">{t.title}</p>
                        <p className="muted checklist__desc">{t.description}</p>
                        <p className="muted checklist__meta">Assigned to {assignees.get(t.assigneeId) ?? 'Unassigned'}</p>
                    </div>
                    <div className="checklist__badges">
                        <TaskStatusBadge status={t.status} />
                        <PriorityBadge priority={t.priority} />
                        <ReviewBadge review={t.supervisorReview} />
                    </div>
                </li>
            ))}
        </ul>
    )
}

export function ChecklistPanel({ tasks, assignees }: { tasks: HousekeepingTask[]; assignees: Map<string, string> }) {
    const mandatory = tasks.filter((t) => t.mandatory)
    const optional = tasks.filter((t) => !t.mandatory)
    const done = mandatory.filter((t) => t.status === 'done').length

    return (
        <section className="card" aria-labelledby="h-checklist">
            <h2 id="h-checklist">Housekeeping checklist</h2>

            <div className="checklist__summary">
                <h3>Mandatory tasks</h3>
                <span className="muted">
                    {done} of {mandatory.length} done
                </span>
            </div>
            <div
                className="progress"
                role="progressbar"
                aria-label="Mandatory tasks completed"
                aria-valuemin={0}
                aria-valuemax={mandatory.length}
                aria-valuenow={done}
                aria-valuetext={`${done} of ${mandatory.length} mandatory tasks done`}
            >
                <span className="progress__fill progress__fill--teal" style={{ width: `${percent(done, mandatory.length)}%` }} />
            </div>
            {mandatory.length === 0 ? <p className="panel-empty">No mandatory tasks.</p> : <TaskList tasks={mandatory} assignees={assignees} />}

            <h3 className="checklist__optional-title">Optional tasks</h3>
            {optional.length === 0 ? (
                <p className="panel-empty">No optional tasks for this room.</p>
            ) : (
                <>
                    <p className="muted">Optional tasks never block readiness.</p>
                    <TaskList tasks={optional} assignees={assignees} />
                </>
            )}

            <p className="muted checklist__note">
                Task updates are read-only in this prototype. Updating tasks will use ServiceNow records and
                permissions in a later phase.
            </p>
        </section>
    )
}
