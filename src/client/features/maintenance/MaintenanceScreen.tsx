import React, { useMemo, useState } from 'react'
import { DataGate } from '../../app/data'
import type { ReadyData } from '../../app/data'
import { useSession } from '../../app/session'
import { formatAgo } from '../../domain/format'
import { DEFECT_STATUS_LABEL, SEVERITY_META } from '../../domain/labels'
import { scopeDefectsForRole } from '../../domain/scope'
import { SEVERITIES } from '../../domain/validation'
import type { Defect, DefectStatus, Severity } from '../../types/domain'
import { Badge, DefectStatusBadge, SeverityBadge } from '../../components/ui/Badge'
import { Banner } from '../../components/ui/Banner'
import { Icon } from '../../components/ui/Icon'
import { KpiCard } from '../../components/ui/KpiCard'
import { EmptyState } from '../../components/ui/StateScreen'
import { ReportDefectDialog } from './ReportDefectDialog'
import { ResolutionDialog } from './ResolutionDialog'

const PAGE_SIZE = 15
const MAX_SEARCH_LENGTH = 30
const SEVERITY_RANK: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_RANK: Record<DefectStatus, number> = { open: 0, in_progress: 1, resolved: 2 }

type StatusFilter = 'unresolved' | 'all' | DefectStatus
type SeverityFilter = 'all' | Severity
type BlockingFilter = 'all' | 'blocking' | 'non_blocking'

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
    { value: 'unresolved', label: 'Unresolved' },
    { value: 'all', label: 'All' },
    { value: 'open', label: DEFECT_STATUS_LABEL.open },
    { value: 'in_progress', label: DEFECT_STATUS_LABEL.in_progress },
    { value: 'resolved', label: DEFECT_STATUS_LABEL.resolved },
]

const isStatus = (v: string): v is StatusFilter => STATUS_OPTIONS.some((o) => o.value === v)
const isSeverity = (v: string): v is SeverityFilter => v === 'all' || (SEVERITIES as string[]).includes(v)
const isBlocking = (v: string): v is BlockingFilter => v === 'all' || v === 'blocking' || v === 'non_blocking'

export function MaintenanceScreen() {
    return <DataGate loadingLabel="Loading defects">{(data) => <Maintenance data={data} />}</DataGate>
}

function Maintenance({ data }: { data: ReadyData }) {
    const { role, user } = useSession()
    const { snapshot, scoped } = data

    const [query, setQuery] = useState('')
    const [status, setStatus] = useState<StatusFilter>('unresolved')
    const [severity, setSeverity] = useState<SeverityFilter>('all')
    const [blocking, setBlocking] = useState<BlockingFilter>('all')
    const [showAll, setShowAll] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [resolving, setResolving] = useState<Defect | null>(null)

    const staffNames = useMemo(() => new Map(snapshot.staff.map((s) => [s.id, s.name])), [snapshot.staff])
    const { rows: allRows, note } = useMemo(() => scopeDefectsForRole(scoped.views, role, user), [scoped, role, user])

    // Only housekeeping staff and supervisors report defects; only maintenance staff record resolutions.
    const canReport = role === 'housekeeping' || role === 'supervisor'
    const canResolve = role === 'maintenance'

    const kpis = useMemo(() => {
        const unresolved = allRows.filter((r) => r.defect.status !== 'resolved')
        return {
            open: allRows.filter((r) => r.defect.status === 'open').length,
            inProgress: allRows.filter((r) => r.defect.status === 'in_progress').length,
            resolved: allRows.filter((r) => r.defect.status === 'resolved').length,
            blocking: unresolved.filter((r) => r.defect.blocking).length,
        }
    }, [allRows])

    const rows = useMemo(() => {
        // Search text is only compared against data. It is never rendered as HTML or evaluated.
        const q = query.trim().toLowerCase()
        return allRows
            .filter(({ defect }) => (status === 'all' ? true : status === 'unresolved' ? defect.status !== 'resolved' : defect.status === status))
            .filter(({ defect }) => severity === 'all' || defect.severity === severity)
            .filter(({ defect }) => blocking === 'all' || (blocking === 'blocking') === defect.blocking)
            .filter(({ defect }) => q === '' || defect.roomId.includes(q) || defect.title.toLowerCase().includes(q))
            .sort(
                (a, b) =>
                    STATUS_RANK[a.defect.status] - STATUS_RANK[b.defect.status] ||
                    Number(b.defect.blocking) - Number(a.defect.blocking) ||
                    SEVERITY_RANK[a.defect.severity] - SEVERITY_RANK[b.defect.severity] ||
                    a.defect.roomId.localeCompare(b.defect.roomId, undefined, { numeric: true })
            )
    }, [allRows, query, status, severity, blocking])

    const visible = showAll ? rows : rows.slice(0, PAGE_SIZE)

    return (
        <div className="stack">
            <Banner tone="info">
                <strong>Prototype.</strong> Defects are synthetic and read-only. Reports and resolutions are checked by the
                form but not saved until the ServiceNow backend exists.
            </Banner>

            <section aria-label="Defect summary" className="kpis kpis--4">
                <KpiCard label="Open" value={kpis.open} tone="warning" icon="alert-small" />
                <KpiCard label="In progress" value={kpis.inProgress} tone="info" icon="clock" />
                <KpiCard label="Resolved" value={kpis.resolved} tone="success" icon="check-circle" />
                <KpiCard label="Unresolved and blocking" value={kpis.blocking} hint="Prevent rooms from being Ready" tone="danger" icon="lock" />
            </section>

            <section className="card" aria-labelledby="h-defect-list">
                <div className="card__head">
                    <h2 id="h-defect-list">Defects</h2>
                    {canReport ? (
                        <button type="button" className="btn btn--primary" onClick={() => setReporting(true)}>
                            <Icon name="wrench" size={16} /> Report a defect
                        </button>
                    ) : null}
                </div>

                <div className="toolbar">
                    <label className="field field--search">
                        <span className="sr-only">Search by room number or problem</span>
                        <Icon name="search" size={16} />
                        <input
                            type="search"
                            placeholder="Search room or problem"
                            value={query}
                            maxLength={MAX_SEARCH_LENGTH}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </label>
                    <label className="field">
                        <span>Status</span>
                        <select value={status} onChange={(e) => isStatus(e.target.value) && setStatus(e.target.value)}>
                            {STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>Severity</span>
                        <select value={severity} onChange={(e) => isSeverity(e.target.value) && setSeverity(e.target.value)}>
                            <option value="all">All</option>
                            {SEVERITIES.map((s) => (
                                <option key={s} value={s}>
                                    {SEVERITY_META[s].label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="field">
                        <span>Readiness</span>
                        <select value={blocking} onChange={(e) => isBlocking(e.target.value) && setBlocking(e.target.value)}>
                            <option value="all">All</option>
                            <option value="blocking">Blocking only</option>
                            <option value="non_blocking">Non-blocking only</option>
                        </select>
                    </label>
                </div>

                <p className="muted" role="status">
                    {note} Showing {visible.length} of {rows.length} matching defects.
                </p>

                {allRows.length === 0 ? (
                    <EmptyState title="No defects to show" message="No defects are currently visible to your role." />
                ) : rows.length === 0 ? (
                    <EmptyState title="No matching defects" message="Try a different search or filter." />
                ) : (
                    <>
                        <div className="table-wrap">
                            <table className="table">
                                <caption className="sr-only">Maintenance defects, most urgent first</caption>
                                <thead>
                                    <tr>
                                        <th scope="col">Room</th>
                                        <th scope="col">Problem</th>
                                        <th scope="col">Severity</th>
                                        <th scope="col">Readiness impact</th>
                                        <th scope="col">Status</th>
                                        <th scope="col">Technician</th>
                                        <th scope="col">Resolution notes</th>
                                        {canResolve ? <th scope="col">Action</th> : null}
                                    </tr>
                                </thead>
                                <tbody>
                                    {visible.map(({ defect }) => (
                                        <tr key={defect.id}>
                                            <th scope="row">
                                                <a className="link" href={`#/rooms/${encodeURIComponent(defect.roomId)}`}>
                                                    {defect.roomId}
                                                </a>
                                            </th>
                                            <td className="table__task">
                                                {/* Defect text is untrusted input; React renders it as plain text. */}
                                                <span className="table__task-title">{defect.title}</span>
                                                <span className="muted table__sub">{defect.description}</span>
                                                <span className="muted table__sub">Reported {formatAgo(defect.reportedAt, snapshot.generatedAt)}</span>
                                            </td>
                                            <td>
                                                <SeverityBadge severity={defect.severity} />
                                            </td>
                                            <td>
                                                {defect.blocking ? (
                                                    <Badge tone="danger" label="Blocks readiness" icon="lock" />
                                                ) : (
                                                    <Badge tone="neutral" label="Does not block" />
                                                )}
                                            </td>
                                            <td>
                                                <DefectStatusBadge status={defect.status} />
                                            </td>
                                            <td>{defect.technicianId ? (staffNames.get(defect.technicianId) ?? 'Unknown') : 'Unassigned'}</td>
                                            <td className="table__notes">{defect.resolutionNotes ?? <span className="muted">None</span>}</td>
                                            {canResolve ? (
                                                <td>
                                                    {defect.technicianId === user.id && defect.status !== 'resolved' ? (
                                                        <button type="button" className="btn btn--ghost btn--flat" onClick={() => setResolving(defect)}>
                                                            Record resolution
                                                        </button>
                                                    ) : (
                                                        <span className="muted">None available</span>
                                                    )}
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {rows.length > PAGE_SIZE ? (
                            <button type="button" className="btn btn--ghost" onClick={() => setShowAll((s) => !s)}>
                                {showAll ? 'Show fewer' : `Show all ${rows.length} defects`}
                            </button>
                        ) : null}
                    </>
                )}
            </section>

            {reporting ? <ReportDefectDialog rooms={scoped.views} onClose={() => setReporting(false)} /> : null}
            {resolving ? <ResolutionDialog defect={resolving} onClose={() => setResolving(null)} /> : null}
        </div>
    )
}
