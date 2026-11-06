import React, { useMemo, useState } from 'react'
import { useSession } from '../auth/session'
import { DataGate } from '../../shared/api/DataContext'
import type { ReadyData } from '../../shared/api/DataContext'
import { INSPECTION_LABEL, ROOM_STATUS_META, TASK_PRIORITY_ORDER } from '../../shared/domain/labels'
import { RoomStatusBadge, TaskPriorityBadge } from '../../shared/domain/StatusBadges'
import type { RoomStatus, RoomView } from '../../shared/domain/types'
import { percent, plural } from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'
import { EmptyState } from '../../shared/ui/StateScreen'
import { tabPanelProps, ViewTabs } from '../../shared/ui/ViewTabs'
import { CLEANING_LABEL, cleaningProgress } from './progress'
import { RoomCard } from './RoomCard'
import { priorityRank, STATUS_ORDER } from './roomViews'

/**
 * Rooms: one page with pre-built views of the same rooms (this replaced the separate
 * Room Readiness and Housekeeping pages).
 *   Priorities              rooms with open tasks, highest task priority first
 *   Cleaning and inspection cleaning progress next to inspection and readiness
 *   Board                   one card per room
 */

const MAX_SEARCH_LENGTH = 30
type StatusFilter = 'all' | RoomStatus
type RoomsViewId = 'priorities' | 'cleaning' | 'board'

function isStatusFilter(value: string): value is StatusFilter {
    return value === 'all' || (STATUS_ORDER as string[]).includes(value)
}

function RoomLink({ view }: { view: RoomView }) {
    return (
        <>
            <a className="link" href={`#/rooms/${encodeURIComponent(view.room.id)}`}>
                {view.room.id}
            </a>
            <span className="muted table__sub">
                Floor {view.room.floor} · {view.room.type}
            </span>
        </>
    )
}

/** The first open mandatory task in priority order: what to do next in this room. */
function nextTask(view: RoomView): string | undefined {
    const open = view.tasks.filter((t) => t.status === 'pending')
    const sorted = [...open].sort((a, b) => Number(b.mandatory) - Number(a.mandatory) || TASK_PRIORITY_ORDER.indexOf(a.priority) - TASK_PRIORITY_ORDER.indexOf(b.priority))
    return sorted[0]?.title
}

export function RoomsScreen() {
    return <DataGate loadingLabel="Loading rooms">{(data) => <Rooms data={data} />}</DataGate>
}

function Rooms({ data }: { data: ReadyData }) {
    const { role } = useSession()
    const { scoped } = data
    const showAssignee = role !== 'housekeeping'

    const [view, setView] = useState<RoomsViewId>(role === 'housekeeping' ? 'priorities' : 'cleaning')
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<StatusFilter>('all')
    const [floor, setFloor] = useState<'all' | number>('all')

    const floors = useMemo(() => [...new Set(scoped.views.map((v) => v.room.floor))].sort((a, b) => a - b), [scoped])

    const filtered = useMemo(() => {
        // Search text is only compared against data. It is never rendered as HTML or evaluated.
        const q = query.trim().toLowerCase()
        return scoped.views.filter(
            (v) =>
                (status === 'all' || v.readiness.status === status) &&
                (floor === 'all' || v.room.floor === floor) &&
                (q === '' || v.room.id.includes(q) || v.room.type.toLowerCase().includes(q) || (v.assignee?.name.toLowerCase().includes(q) ?? false))
        )
    }, [scoped, query, status, floor])

    const withOpenWork = useMemo(
        () =>
            filtered
                .filter((v) => v.priority !== undefined)
                .sort(
                    (a, b) =>
                        priorityRank(a.priority) - priorityRank(b.priority) ||
                        b.readiness.openTasks - a.readiness.openTasks ||
                        a.room.id.localeCompare(b.room.id, undefined, { numeric: true })
                ),
        [filtered]
    )

    if (scoped.views.length === 0) {
        return <EmptyState title="No rooms to show" message="No rooms are currently assigned to you." />
    }

    const tabs = [
        { id: 'priorities' as const, label: 'Priorities', count: withOpenWork.length },
        { id: 'cleaning' as const, label: 'Cleaning and inspection' },
        { id: 'board' as const, label: 'Board' },
    ]
    const shown = view === 'priorities' ? withOpenWork.length : filtered.length

    return (
        <div className="stack">
            <div className="toolbar toolbar--board">
                <label className="field field--search">
                    <span className="sr-only">Search by room number, room type or staff name</span>
                    <Icon name="search" size={16} />
                    <input
                        type="search"
                        placeholder="Search room, type or staff"
                        value={query}
                        maxLength={MAX_SEARCH_LENGTH}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </label>
                <label className="field">
                    <span>Status</span>
                    <select value={status} onChange={(e) => isStatusFilter(e.target.value) && setStatus(e.target.value)}>
                        <option value="all">All statuses</option>
                        {STATUS_ORDER.map((s) => (
                            <option key={s} value={s}>
                                {ROOM_STATUS_META[s].label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="field">
                    <span>Floor</span>
                    <select value={String(floor)} onChange={(e) => setFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}>
                        <option value="all">All floors</option>
                        {floors.map((f) => (
                            <option key={f} value={f}>
                                Floor {f}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <ViewTabs label="Room views" idPrefix="rooms-view" tabs={tabs} active={view} onChange={setView} />

            <div {...tabPanelProps('rooms-view', view)} className="stack">
                <p className="muted" role="status">
                    {scoped.note}{' '}
                    {view === 'priorities'
                        ? `${plural(shown, 'room')} with open tasks, highest priority first.`
                        : `Showing ${shown} of ${scoped.views.length} rooms.`}
                </p>

                {shown === 0 ? (
                    <EmptyState
                        title={view === 'priorities' ? 'No open tasks' : 'No matching rooms'}
                        message={view === 'priorities' ? 'Every task in these rooms is completed.' : 'Try a different search or filter.'}
                    />
                ) : view === 'priorities' ? (
                    <PrioritiesTable views={withOpenWork} showAssignee={showAssignee} />
                ) : view === 'cleaning' ? (
                    <>
                        {showAssignee ? <StaffProgress views={filtered} /> : null}
                        <CleaningTable views={filtered} showAssignee={showAssignee} />
                    </>
                ) : (
                    <ul className="room-grid">
                        {filtered.map((v) => (
                            <RoomCard key={v.room.id} view={v} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

function PrioritiesTable({ views, showAssignee }: { views: RoomView[]; showAssignee: boolean }) {
    return (
        <div className="table-wrap">
            <table className="table table--stack">
                <caption className="sr-only">Rooms with open tasks, highest priority first</caption>
                <thead>
                    <tr>
                        <th scope="col">Room</th>
                        <th scope="col">Priority</th>
                        <th scope="col">Next task</th>
                        <th scope="col">Open tasks</th>
                        <th scope="col">Status</th>
                        {showAssignee ? <th scope="col">Assigned to</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {views.map((v) => (
                        <tr key={v.room.id}>
                            <th scope="row">
                                <RoomLink view={v} />
                            </th>
                            <td data-label="Priority">{v.priority ? <TaskPriorityBadge priority={v.priority} /> : null}</td>
                            <td data-label="Next task">{nextTask(v) ?? <span className="muted">Waiting on a task that couldn&apos;t be completed</span>}</td>
                            <td data-label="Open tasks">
                                {v.readiness.openTasks}
                                {v.readiness.mandatoryCouldntComplete > 0 ? (
                                    <span className="muted table__sub">{v.readiness.mandatoryCouldntComplete} couldn&apos;t complete</span>
                                ) : null}
                            </td>
                            <td data-label="Status">
                                <RoomStatusBadge status={v.readiness.status} />
                            </td>
                            {showAssignee ? <td data-label="Assigned to">{v.assignee?.name ?? 'Unassigned'}</td> : null}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function CleaningTable({ views, showAssignee }: { views: RoomView[]; showAssignee: boolean }) {
    return (
        <div className="table-wrap">
            <table className="table table--stack">
                <caption className="sr-only">Cleaning progress, inspection and readiness for each room</caption>
                <thead>
                    <tr>
                        <th scope="col">Room</th>
                        <th scope="col">Cleaning</th>
                        <th scope="col">Couldn&apos;t complete</th>
                        <th scope="col">Inspection</th>
                        <th scope="col">Status</th>
                        {showAssignee ? <th scope="col">Assigned to</th> : null}
                    </tr>
                </thead>
                <tbody>
                    {views.map((v) => {
                        const c = cleaningProgress(v)
                        return (
                            <tr key={v.room.id}>
                                <th scope="row">
                                    <RoomLink view={v} />
                                </th>
                                <td data-label="Cleaning">
                                    {CLEANING_LABEL[c.state]} ({c.done}/{c.total})
                                </td>
                                <td data-label="Couldn't complete">
                                    {v.readiness.mandatoryCouldntComplete > 0 ? v.readiness.mandatoryCouldntComplete : <span className="muted">None</span>}
                                </td>
                                <td data-label="Inspection">{INSPECTION_LABEL[v.room.inspection]}</td>
                                <td data-label="Status">
                                    <RoomStatusBadge status={v.readiness.status} />
                                </td>
                                {showAssignee ? <td data-label="Assigned to">{v.assignee?.name ?? 'Unassigned'}</td> : null}
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}

/** Mandatory tasks completed per housekeeper, for supervisors and administrators. */
function StaffProgress({ views }: { views: RoomView[] }) {
    const people = useMemo(() => {
        const byId = new Map<string, { name: string; done: number; total: number; couldnt: number }>()
        for (const v of views) {
            if (!v.assignee) continue
            const entry = byId.get(v.assignee.id) ?? { name: v.assignee.name, done: 0, total: 0, couldnt: 0 }
            entry.done += v.readiness.mandatoryDone
            entry.total += v.readiness.mandatoryTotal
            entry.couldnt += v.readiness.mandatoryCouldntComplete
            byId.set(v.assignee.id, entry)
        }
        return [...byId.entries()].map(([id, e]) => ({ id, ...e })).sort((a, b) => a.name.localeCompare(b.name))
    }, [views])

    if (people.length === 0) return null

    return (
        <section className="card" aria-labelledby="h-staff">
            <h2 id="h-staff">Progress by housekeeper</h2>
            <ul className="staff-progress">
                {people.map((s) => (
                    <li key={s.id}>
                        <div className="staff-progress__head">
                            <span>{s.name}</span>
                            <span className="muted">
                                {s.done} of {s.total} completed{s.couldnt > 0 ? ` · ${s.couldnt} couldn't complete` : ''}
                            </span>
                        </div>
                        <div
                            className="progress"
                            role="progressbar"
                            aria-label={`${s.name} mandatory tasks completed`}
                            aria-valuemin={0}
                            aria-valuemax={s.total}
                            aria-valuenow={s.done}
                            aria-valuetext={`${s.done} of ${s.total} mandatory tasks completed`}
                        >
                            <span className="progress__fill progress__fill--teal" style={{ width: `${percent(s.done, s.total)}%` }} />
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    )
}
