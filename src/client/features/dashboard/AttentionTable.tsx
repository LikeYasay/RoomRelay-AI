import React, { useMemo, useState } from 'react'
import { capitalizeFirst } from '../../domain/format'
import { ROOM_STATUS_META } from '../../domain/labels'
import type { RoomStatus, RoomView } from '../../types/domain'
import { RoomStatusBadge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/StateScreen'
import { Icon } from '../../components/ui/Icon'

const PAGE_SIZE = 10
const MAX_SEARCH_LENGTH = 30
type StatusFilter = 'all' | Exclude<RoomStatus, 'ready'>

const FILTERABLE: Array<Exclude<RoomStatus, 'ready'>> = ['blocked', 'needs_cleaning', 'in_progress', 'pending_inspection']

function isStatusFilter(value: string): value is StatusFilter {
    return value === 'all' || (FILTERABLE as string[]).includes(value)
}

function urgency(v: RoomView): number {
    return (v.readiness.blockers[0]?.weight ?? 0) + (v.readiness.status === 'blocked' ? 100 : 0)
}

/** Rooms that are NOT yet Ready, most urgent first, with search and status filter. */
export function AttentionTable({ views }: { views: RoomView[] }) {
    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<StatusFilter>('all')
    const [showAll, setShowAll] = useState(false)

    const rows = useMemo(() => {
        // Search text is only ever compared, never rendered or evaluated.
        const q = query.trim().toLowerCase()
        return views
            .filter((v) => !v.readiness.isReady)
            .filter((v) => status === 'all' || v.readiness.status === status)
            .filter((v) => q === '' || v.room.id.includes(q) || (v.assignee?.name.toLowerCase().includes(q) ?? false))
            .sort((a, b) => urgency(b) - urgency(a) || a.room.id.localeCompare(b.room.id, undefined, { numeric: true }))
    }, [views, query, status])

    const visible = showAll ? rows : rows.slice(0, PAGE_SIZE)

    return (
        <div>
            <div className="toolbar">
                <label className="field field--search">
                    <span className="sr-only">Search rooms by number or staff name</span>
                    <Icon name="search" size={16} />
                    <input
                        type="search"
                        placeholder="Search room or staff"
                        value={query}
                        maxLength={MAX_SEARCH_LENGTH}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </label>
                <label className="field">
                    <span>Status</span>
                    <select value={status} onChange={(e) => isStatusFilter(e.target.value) && setStatus(e.target.value)}>
                        <option value="all">All outstanding</option>
                        {FILTERABLE.map((s) => (
                            <option key={s} value={s}>
                                {ROOM_STATUS_META[s].label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            {rows.length === 0 ? (
                <EmptyState title="No matching rooms" message="Try a different search or status filter." />
            ) : (
                <>
                    <div className="table-wrap">
                        <table className="table">
                            <caption className="sr-only">Rooms that are not yet ready, most urgent first</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Room</th>
                                    <th scope="col">Status</th>
                                    <th scope="col">Mandatory tasks</th>
                                    <th scope="col">Main blocker</th>
                                    <th scope="col">Assigned to</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((v) => (
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
                                            <RoomStatusBadge status={v.readiness.status} />
                                        </td>
                                        <td>
                                            {v.readiness.mandatoryDone}/{v.readiness.mandatoryTotal} done
                                        </td>
                                        <td className="table__blocker">{capitalizeFirst(v.readiness.blockers[0]?.message ?? 'None')}</td>
                                        <td>{v.assignee?.name ?? 'Unassigned'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {rows.length > PAGE_SIZE ? (
                        <button type="button" className="btn btn--ghost" onClick={() => setShowAll((s) => !s)}>
                            {showAll ? 'Show fewer' : `Show all ${rows.length} rooms`}
                        </button>
                    ) : null}
                </>
            )}
        </div>
    )
}
