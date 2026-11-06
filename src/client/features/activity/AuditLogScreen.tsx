import React, { useMemo, useState } from 'react'
import { DataGate } from '../../shared/api/DataContext'
import type { ReadyData } from '../../shared/api/DataContext'
import { AUDIT_ACTION_META, ROLE_LABEL } from '../../shared/domain/labels'
import type { AuditAction } from '../../shared/domain/types'
import { formatAgo, formatDateTime } from '../../shared/lib/format'
import { Banner } from '../../shared/ui/Banner'
import { Icon } from '../../shared/ui/Icon'
import { EmptyState } from '../../shared/ui/StateScreen'

const PAGE_SIZE = 25
const MAX_SEARCH_LENGTH = 30
const ACTIONS = Object.keys(AUDIT_ACTION_META) as AuditAction[]

/**
 * Administrator-only, read-only audit log: who did what, and when. Nothing here can be edited or
 * deleted. The browser only displays it; the real log must be written by the server.
 */
export function AuditLogScreen() {
    return <DataGate loadingLabel="Loading audit log">{(data) => <AuditLog data={data} />}</DataGate>
}

function AuditLog({ data }: { data: ReadyData }) {
    const { snapshot } = data
    const [action, setAction] = useState<'all' | AuditAction>('all')
    const [actor, setActor] = useState('all')
    const [query, setQuery] = useState('')
    const [limit, setLimit] = useState(PAGE_SIZE)

    const staffById = useMemo(() => new Map(snapshot.staff.map((s) => [s.id, s])), [snapshot.staff])

    const rows = useMemo(() => {
        // Search text is only compared against data. It is never rendered as HTML or evaluated.
        const q = query.trim().toLowerCase()
        return snapshot.audit
            .filter((e) => action === 'all' || e.action === action)
            .filter((e) => actor === 'all' || e.actorId === actor)
            .filter((e) => q === '' || (e.roomId ?? '').includes(q) || e.summary.toLowerCase().includes(q))
            .sort((a, b) => b.at.localeCompare(a.at) || b.id.localeCompare(a.id))
    }, [snapshot.audit, action, actor, query])

    const visible = rows.slice(0, limit)

    return (
        <div className="stack">
            <Banner tone="info">
                <strong>Prototype.</strong> These entries are generated from the synthetic data and from changes made in this
                browser tab. In the live system the ServiceNow server writes the log, and sign-ins are recorded by ServiceNow
                itself. Nobody can edit or delete an entry.
            </Banner>

            <section className="card" aria-labelledby="h-audit">
                <h2 id="h-audit">Audit log</h2>
                <div className="toolbar">
                    <label className="field field--search">
                        <span className="sr-only">Search by room number or description</span>
                        <Icon name="search" size={16} />
                        <input
                            type="search"
                            placeholder="Search room or text"
                            value={query}
                            maxLength={MAX_SEARCH_LENGTH}
                            onChange={(e) => {
                                setQuery(e.target.value)
                                setLimit(PAGE_SIZE)
                            }}
                        />
                    </label>
                    <label className="field">
                        <span>Action</span>
                        <select
                            value={action}
                            onChange={(e) => {
                                const v = e.target.value
                                if (v === 'all' || (ACTIONS as string[]).includes(v)) setAction(v as 'all' | AuditAction)
                                setLimit(PAGE_SIZE)
                            }}
                        >
                            <option value="all">All actions</option>
                            {ACTIONS.map((a) => (
                                <option key={a} value={a}>
                                    {AUDIT_ACTION_META[a].label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>Person</span>
                        <select
                            value={actor}
                            onChange={(e) => {
                                const v = e.target.value
                                if (v === 'all' || staffById.has(v)) setActor(v)
                                setLimit(PAGE_SIZE)
                            }}
                        >
                            <option value="all">Everyone</option>
                            {snapshot.staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <p className="muted" role="status">
                    Showing {visible.length} of {rows.length} entries, newest first.
                </p>

                {rows.length === 0 ? (
                    <EmptyState title="No matching entries" message="Try a different search or filter." />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="table table--stack">
                                <caption className="sr-only">Audit log, newest first</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">When</th>
                                        <th scope="col">Who</th>
                                        <th scope="col">Action</th>
                                        <th scope="col">Room</th>
                                        <th scope="col">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map((e) => {
                                        const who = staffById.get(e.actorId)
                                        const meta = AUDIT_ACTION_META[e.action]
                                        return (
                                            <tr key={e.id}>
                                                <th scope="row">
                                                    {formatDateTime(e.at)}
                                                    <span className="muted table__sub">{formatAgo(e.at, snapshot.generatedAt)}</span>
                                                </th>
                                                <td data-label="Who">
                                                    {who?.name ?? 'Unknown'}
                                                    {who ? <span className="muted table__sub">{ROLE_LABEL[who.role]}</span> : null}
                                                </td>
                                                <td data-label="Action">
                                                    <span className="audit__action">
                                                        <Icon name={meta.icon} size={14} /> {meta.label}
                                                    </span>
                                                </td>
                                                <td data-label="Room">
                                                    {e.roomId ? (
                                                        <a className="link" href={`#/rooms/${encodeURIComponent(e.roomId)}`}>
                                                            {e.roomId}
                                                        </a>
                                                    ) : (
                                                        <span className="muted">None</span>
                                                    )}
                                                </td>
                                                {/* Summaries can quote titles typed by staff; React renders them as plain text. */}
                                                <td className="table__notes" data-label="Details">
                                                    {e.summary}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        {rows.length > visible.length ? (
                            <button type="button" className="btn btn--ghost" onClick={() => setLimit((n) => n + PAGE_SIZE)}>
                                Show {Math.min(PAGE_SIZE, rows.length - visible.length)} more
                            </button>
                        ) : null}
                    </>
                )}
            </section>
        </div>
    )
}
