import React, { useMemo, useState } from 'react'
import { DataGate } from '../../app/data'
import type { ReadyData } from '../../app/data'
import { percent } from '../../domain/format'
import { PRIORITY_LABEL, TASK_STATUS_LABEL } from '../../domain/labels'
import type { HousekeepingTask, Priority, TaskStatus } from '../../types/domain'
import { Badge, PriorityBadge, ReviewBadge, TaskStatusBadge } from '../../components/ui/Badge'
import { Banner } from '../../components/ui/Banner'
import { Icon } from '../../components/ui/Icon'
import { KpiCard } from '../../components/ui/KpiCard'
import { EmptyState } from '../../components/ui/StateScreen'

const PAGE_SIZE = 15
const MAX_SEARCH_LENGTH = 30
const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
const STATUS_RANK: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 }

type StatusFilter = 'all' | TaskStatus
type TypeFilter = 'all' | 'mandatory' | 'optional'
type PriorityFilter = 'all' | Priority

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']
const PRIORITIES: Priority[] = ['urgent', 'high', 'normal', 'low']

const isStatus = (v: string): v is StatusFilter => v === 'all' || (STATUSES as string[]).includes(v)
const isType = (v: string): v is TypeFilter => v === 'all' || v === 'mandatory' || v === 'optional'
const isPriority = (v: string): v is PriorityFilter => v === 'all' || (PRIORITIES as string[]).includes(v)

interface TaskRow {
    task: HousekeepingTask
    floor: number
}

export function HousekeepingScreen() {
    return <DataGate loadingLabel="Loading tasks">{(data) => <Housekeeping data={data} />}</DataGate>
}

function Housekeeping({ data }: { data: ReadyData }) {
    const { snapshot, scoped } = data
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<StatusFilter>('all')
    const [type, setType] = useState<TypeFilter>('all')
    const [priority, setPriority] = useState<PriorityFilter>('all')
    const [assignee, setAssignee] = useState('all')
    const [showAll, setShowAll] = useState(false)

    const staffNames = useMemo(() => new Map(snapshot.staff.map((s) => [s.id, s.name])), [snapshot.staff])
    const allTasks = useMemo<TaskRow[]>(
        () => scoped.views.flatMap((v) => v.tasks.map((task) => ({ task, floor: v.room.floor }))),
        [scoped]
    )

    const assigneeIds = useMemo(() => [...new Set(allTasks.map((r) => r.task.assigneeId))], [allTasks])
    // Ignore a stale selection that is no longer in this role's scope.
    const activeAssignee = assignee === 'all' || assigneeIds.includes(assignee) ? assignee : 'all'

    const summary = useMemo(
        () => ({
            open: allTasks.filter((r) => r.task.status === 'todo').length,
            inProgress: allTasks.filter((r) => r.task.status === 'in_progress').length,
            done: allTasks.filter((r) => r.task.status === 'done').length,
            review: allTasks.filter((r) => r.task.supervisorReview === 'pending').length,
        }),
        [allTasks]
    )

    const perStaff = useMemo(
        () =>
            assigneeIds
                .map((id) => {
                    const mine = allTasks.filter((r) => r.task.assigneeId === id)
                    const done = mine.filter((r) => r.task.status === 'done').length
                    return { id, name: staffNames.get(id) ?? 'Unknown', done, total: mine.length }
                })
                .sort((a, b) => a.name.localeCompare(b.name)),
        [assigneeIds, allTasks, staffNames]
    )

    const rows = useMemo(() => {
        // Search text is only compared against data. It is never rendered as HTML or evaluated.
        const q = query.trim().toLowerCase()
        return allTasks
            .filter(({ task }) => status === 'all' || task.status === status)
            .filter(({ task }) => type === 'all' || (type === 'mandatory') === task.mandatory)
            .filter(({ task }) => priority === 'all' || task.priority === priority)
            .filter(({ task }) => activeAssignee === 'all' || task.assigneeId === activeAssignee)
            .filter(({ task }) => q === '' || task.roomId.includes(q) || task.title.toLowerCase().includes(q))
            .sort(
                (a, b) =>
                    STATUS_RANK[a.task.status] - STATUS_RANK[b.task.status] ||
                    PRIORITY_RANK[a.task.priority] - PRIORITY_RANK[b.task.priority] ||
                    a.task.roomId.localeCompare(b.task.roomId, undefined, { numeric: true })
            )
    }, [allTasks, query, status, type, priority, activeAssignee])

    if (allTasks.length === 0) {
        return <EmptyState title="No tasks to show" message="No housekeeping tasks are currently assigned to you." />
    }

    const visible = showAll ? rows : rows.slice(0, PAGE_SIZE)

    return (
        <div className="stack">
            <Banner tone="info">
                <strong>Prototype.</strong> Tasks are read-only synthetic data. Updating or assigning tasks will use
                ServiceNow records, roles and ACLs in a later phase.
            </Banner>

            <section aria-label="Task summary" className="kpis kpis--4">
                <KpiCard label="To do" value={summary.open} tone="warning" />
                <KpiCard label="In progress" value={summary.inProgress} tone="info" />
                <KpiCard label="Completed" value={summary.done} tone="success" />
                <KpiCard label="Awaiting supervisor review" value={summary.review} tone="review" />
            </section>

            <section className="card" aria-labelledby="h-staff">
                <h2 id="h-staff">Task progress by employee</h2>
                <ul className="staff-progress">
                    {perStaff.map((s) => (
                        <li key={s.id}>
                            <div className="staff-progress__head">
                                <span>{s.name}</span>
                                <span className="muted">
                                    {s.done} of {s.total} done
                                </span>
                            </div>
                            <div
                                className="progress"
                                role="progressbar"
                                aria-label={`${s.name} task completion`}
                                aria-valuemin={0}
                                aria-valuemax={s.total}
                                aria-valuenow={s.done}
                                aria-valuetext={`${s.done} of ${s.total} tasks done`}
                            >
                                <span className="progress__fill progress__fill--teal" style={{ width: `${percent(s.done, s.total)}%` }} />
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="card" aria-labelledby="h-tasks">
                <h2 id="h-tasks">Tasks</h2>
                <div className="toolbar">
                    <label className="field field--search">
                        <span className="sr-only">Search by room number or task name</span>
                        <Icon name="search" size={16} />
                        <input
                            type="search"
                            placeholder="Search room or task"
                            value={query}
                            maxLength={MAX_SEARCH_LENGTH}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </label>
                    <label className="field">
                        <span>Status</span>
                        <select value={status} onChange={(e) => isStatus(e.target.value) && setStatus(e.target.value)}>
                            <option value="all">All</option>
                            {STATUSES.map((s) => (
                                <option key={s} value={s}>
                                    {TASK_STATUS_LABEL[s]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>Type</span>
                        <select value={type} onChange={(e) => isType(e.target.value) && setType(e.target.value)}>
                            <option value="all">Required and optional</option>
                            <option value="mandatory">Required only</option>
                            <option value="optional">Optional only</option>
                        </select>
                    </label>
                    <label className="field">
                        <span>Priority</span>
                        <select value={priority} onChange={(e) => isPriority(e.target.value) && setPriority(e.target.value)}>
                            <option value="all">All</option>
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>
                                    {PRIORITY_LABEL[p]}
                                </option>
                            ))}
                        </select>
                    </label>
                    {assigneeIds.length > 1 ? (
                        <label className="field">
                            <span>Employee</span>
                            <select value={activeAssignee} onChange={(e) => setAssignee(e.target.value)}>
                                <option value="all">Everyone</option>
                                {perStaff.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}
                </div>

                <p className="muted" role="status">
                    {scoped.note} Showing {Math.min(visible.length, rows.length)} of {rows.length} matching tasks.
                </p>

                {rows.length === 0 ? (
                    <EmptyState title="No matching tasks" message="Try a different search or filter." />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="table">
                                <caption className="sr-only">Housekeeping tasks, unfinished first</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Room</th>
                                        <th scope="col">Task</th>
                                        <th scope="col">Type</th>
                                        <th scope="col">Priority</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Assigned to</th>
                                        <th scope="col">Supervisor review</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map(({ task, floor }) => (
                                        <tr key={task.id}>
                                            <th scope="row">
                                                <a className="link" href={`#/rooms/${encodeURIComponent(task.roomId)}`}>
                                                    {task.roomId}
                                                </a>
                                                <span className="muted table__sub">Floor {floor}</span>
                                            </th>
                                            <td className="table__task">
                                                <span className="table__task-title">{task.title}</span>
                                                <span className="muted table__sub">{task.description}</span>
                                            </td>
                                            <td>
                                                {task.mandatory ? (
                                                    <Badge tone="info" label="Required" icon="lock" />
                                                ) : (
                                                    <Badge tone="neutral" label="Optional" />
                                                )}
                                            </td>
                                            <td>
                                                <PriorityBadge priority={task.priority} />
                                            </td>
                                            <td>
                                                <TaskStatusBadge status={task.status} />
                                            </td>
                                            <td>{staffNames.get(task.assigneeId) ?? 'Unassigned'}</td>
                                            <td>
                                                <ReviewBadge review={task.supervisorReview} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {rows.length > PAGE_SIZE ? (
                            <button type="button" className="btn btn--ghost" onClick={() => setShowAll((s) => !s)}>
                                {showAll ? 'Show fewer' : `Show all ${rows.length} tasks`}
                            </button>
                        ) : null}
                    </>
                )}
            </section>
        </div>
    )
}
