import React, { useMemo, useState } from 'react'
import { DataGate } from '../../app/data'
import type { ReadyData } from '../../app/data'
import { CLEANING_LABEL, cleaningProgress } from '../../domain/progress'
import { INSPECTION_LABEL, ROOM_STATUS_META } from '../../domain/labels'
import { STATUS_ORDER } from '../../domain/selectors'
import type { RoomStatus } from '../../types/domain'
import { RoomStatusBadge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'
import { EmptyState } from '../../components/ui/StateScreen'
import { RoomCard } from './RoomCard'

const MAX_SEARCH_LENGTH = 30
type StatusFilter = 'all' | RoomStatus
type ViewMode = 'cards' | 'table'

function isStatusFilter(value: string): value is StatusFilter {
    return value === 'all' || (STATUS_ORDER as string[]).includes(value)
}

export function RoomBoardScreen() {
    return <DataGate loadingLabel="Loading rooms">{(data) => <RoomBoard data={data} />}</DataGate>
}

function RoomBoard({ data }: { data: ReadyData }) {
    const { scoped } = data
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<StatusFilter>('all')
    const [floor, setFloor] = useState<'all' | number>('all')
    const [mode, setMode] = useState<ViewMode>('cards')

    const floors = useMemo(() => [...new Set(scoped.views.map((v) => v.room.floor))].sort((a, b) => a - b), [scoped])

    const rows = useMemo(() => {
        // Search text is only compared against data. It is never rendered as HTML or evaluated.
        const q = query.trim().toLowerCase()
        return scoped.views.filter(
            (v) =>
                (status === 'all' || v.readiness.status === status) &&
                (floor === 'all' || v.room.floor === floor) &&
                (q === '' ||
                    v.room.id.includes(q) ||
                    v.room.type.toLowerCase().includes(q) ||
                    (v.assignee?.name.toLowerCase().includes(q) ?? false))
        )
    }, [scoped, query, status, floor])

    if (scoped.views.length === 0) {
        return <EmptyState title="No rooms to show" message="No rooms are currently assigned to you." />
    }

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
                    <select
                        value={String(floor)}
                        onChange={(e) => setFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">All floors</option>
                        {floors.map((f) => (
                            <option key={f} value={f}>
                                Floor {f}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="segmented" role="group" aria-label="Board layout">
                    <button type="button" aria-pressed={mode === 'cards'} onClick={() => setMode('cards')}>
                        <Icon name="grid" size={16} /> Cards
                    </button>
                    <button type="button" aria-pressed={mode === 'table'} onClick={() => setMode('table')}>
                        <Icon name="table" size={16} /> Table
                    </button>
                </div>
            </div>

            <p className="muted" role="status">
                {scoped.note} Showing {rows.length} of {scoped.views.length} rooms.
            </p>

            {rows.length === 0 ? (
                <EmptyState title="No matching rooms" message="Try a different search or filter." />
            ) : mode === 'cards' ? (
                <ul className="room-grid">
                    {rows.map((v) => (
                        <RoomCard key={v.room.id} view={v} />
                    ))}
                </ul>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <caption className="sr-only">Room readiness board</caption>
                        <thead>
                            <tr>
                                <th scope="col">Room</th>
                                <th scope="col">Cleaning</th>
                                <th scope="col">Inspection</th>
                                <th scope="col">Readiness</th>
                                <th scope="col">Open tasks</th>
                                <th scope="col">Blocking defects</th>
                                <th scope="col">Assigned to</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((v) => {
                                const c = cleaningProgress(v)
                                return (
                                    <tr key={v.room.id}>
                                        <th scope="row">
                                            <a className="link" href={`#/rooms/${encodeURIComponent(v.room.id)}`}>
                                                {v.room.id}
                                            </a>
                                            <span className="muted table__sub">
                                                Floor {v.room.floor} · {v.room.type}
                                            </span>
                                        </th>
                                        <td>
                                            {CLEANING_LABEL[c.state]} ({c.done}/{c.total})
                                        </td>
                                        <td>{INSPECTION_LABEL[v.room.inspection]}</td>
                                        <td>
                                            <RoomStatusBadge status={v.readiness.status} />
                                        </td>
                                        <td>{v.readiness.openTasks}</td>
                                        <td>{v.readiness.openBlockingDefects}</td>
                                        <td>{v.assignee?.name ?? 'Unassigned'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
