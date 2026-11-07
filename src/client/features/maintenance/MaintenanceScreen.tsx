import React, { useMemo, useState } from 'react'
import { DATA_NOTE } from '../../shared/api/environment'
import { useSession } from '../auth/session'
import { DataGate } from '../../shared/api/DataContext'
import type { ReadyData } from '../../shared/api/DataContext'
import { DEFECT_PRIORITY_META, DEFECT_PRIORITY_ORDER, DEFECT_STATUS_ORDER } from '../../shared/domain/labels'
import { DefectPriorityBadge, DefectStatusBadge } from '../../shared/domain/StatusBadges'
import type { Defect, DefectPriority, Role } from '../../shared/domain/types'
import { formatAgo } from '../../shared/lib/format'
import { Banner } from '../../shared/ui/Banner'
import { Icon } from '../../shared/ui/Icon'
import { KpiCard } from '../../shared/ui/KpiCard'
import { EmptyState } from '../../shared/ui/StateScreen'
import { tabPanelProps, ViewTabs } from '../../shared/ui/ViewTabs'
import { isBlockingOpen } from './blockers'
import { DefectModal } from './DefectModal'
import { ReportDefectDialog } from './ReportDefectDialog'
import { scopeDefectsForRole } from './scope'
import type { DefectRow } from './scope'

const PAGE_SIZE = 15
const MAX_SEARCH_LENGTH = 30

type ViewId = 'new' | 'open' | 'queue' | 'in_progress' | 'resolved'
type PriorityFilter = 'all' | DefectPriority

/** Defect ids look like D-305-1. Anything else in the address is ignored. */
function isValidDefectId(value: string | undefined): value is string {
    return value !== undefined && /^D-\d{3,4}-\d{1,3}$/.test(value)
}

const VIEW_LABEL: Record<ViewId, string> = {
    new: 'New reports',
    open: 'All open',
    queue: 'My queue',
    in_progress: 'In progress',
    resolved: 'Resolved',
}

/** Pre-built views per role: supervisors start with the triage queue, technicians with their own queue. */
const VIEWS_BY_ROLE: Record<Role, ViewId[]> = {
    supervisor: ['new', 'open', 'resolved'],
    maintenance: ['queue', 'in_progress', 'resolved'],
    housekeeping: ['open', 'resolved'],
    admin: ['open', 'new', 'resolved'],
}

function inView(view: ViewId, d: Defect): boolean {
    switch (view) {
        case 'new':
            return d.status === 'new'
        case 'open':
            return d.status !== 'resolved'
        case 'queue':
            return d.status === 'assigned' || d.status === 'in_progress'
        case 'in_progress':
            return d.status === 'in_progress'
        case 'resolved':
            return d.status === 'resolved'
    }
}

/** Blocking first, then by status, then oldest first. Resolved: most recent first. */
function compare(view: ViewId, a: Defect, b: Defect): number {
    if (view === 'resolved') return (b.resolvedAt ?? '').localeCompare(a.resolvedAt ?? '')
    return (
        DEFECT_PRIORITY_ORDER.indexOf(a.priority) - DEFECT_PRIORITY_ORDER.indexOf(b.priority) ||
        DEFECT_STATUS_ORDER.indexOf(a.status) - DEFECT_STATUS_ORDER.indexOf(b.status) ||
        a.reportedAt.localeCompare(b.reportedAt)
    )
}

export function MaintenanceScreen({ defectId }: { defectId?: string }) {
    return <DataGate loadingLabel="Loading defects">{(data) => <Maintenance data={data} initialDefectId={defectId} />}</DataGate>
}

function Maintenance({ data, initialDefectId }: { data: ReadyData; initialDefectId?: string }) {
    const { role, user } = useSession()
    const { snapshot, scoped } = data
    const views = VIEWS_BY_ROLE[role]

    const [view, setView] = useState<ViewId>(views[0] ?? 'open')
    const [query, setQuery] = useState('')
    const [priority, setPriority] = useState<PriorityFilter>('all')
    const [showAll, setShowAll] = useState(false)
    const [reporting, setReporting] = useState(false)
    const [openId, setOpenId] = useState<string | undefined>(isValidDefectId(initialDefectId) ? initialDefectId : undefined)
    const [notice, setNotice] = useState<string | null>(null)

    const staffName = useMemo(() => new Map(snapshot.staff.map((s) => [s.id, s.name])), [snapshot.staff])
    const { rows: allRows, note } = useMemo(() => scopeDefectsForRole(scoped.views, role, user), [scoped, role, user])

    // Only housekeeping staff and supervisors report defects.
    const canReport = role === 'housekeeping' || role === 'supervisor'

    const kpis = useMemo(() => {
        const all = allRows.map((r) => r.defect)
        return {
            new: all.filter((d) => d.status === 'new').length,
            assigned: all.filter((d) => d.status === 'assigned').length,
            inProgress: all.filter((d) => d.status === 'in_progress').length,
            blocking: all.filter(isBlockingOpen).length,
        }
    }, [allRows])

    const counts = useMemo(() => {
        const c = {} as Record<ViewId, number>
        for (const v of views) c[v] = allRows.filter((r) => inView(v, r.defect)).length
        return c
    }, [allRows, views])

    const rows = useMemo<DefectRow[]>(() => {
        // Search text is only compared against data. It is never rendered as HTML or evaluated.
        const q = query.trim().toLowerCase()
        return allRows
            .filter((r) => inView(view, r.defect))
            .filter((r) => priority === 'all' || r.defect.priority === priority)
            .filter((r) => q === '' || r.defect.roomId.includes(q) || r.defect.title.toLowerCase().includes(q))
            .sort((a, b) => compare(view, a.defect, b.defect))
    }, [allRows, view, priority, query])

    const visible = showAll ? rows : rows.slice(0, PAGE_SIZE)

    const closeModal = () => {
        setOpenId(undefined)
        if (initialDefectId) window.location.hash = '#/maintenance'
    }

    const actionLabel = (d: Defect) => {
        if (role === 'supervisor' && d.status === 'new') return 'Triage'
        if (role === 'maintenance' && d.technicianId === user.id && d.status !== 'resolved') return 'Work on it'
        return 'View'
    }

    return (
        <div className="stack">
            {DATA_NOTE.changes ? (
                <Banner tone="info">
                    <strong>Local preview.</strong> {DATA_NOTE.changes}
                </Banner>
            ) : null}

            {notice ? (
                <div role="status">
                    <Banner tone="info">{notice}</Banner>
                </div>
            ) : null}

            <section aria-label="Defect summary" className="kpis kpis--4">
                <KpiCard label="New reports" value={kpis.new} hint="Waiting for a supervisor" tone="warning" />
                <KpiCard label="Assigned" value={kpis.assigned} tone="info" />
                <KpiCard label="In progress" value={kpis.inProgress} tone="info" />
                <KpiCard label="Blocking" value={kpis.blocking} hint="Rooms cannot be Ready" tone="danger" />
            </section>

            <section className="card" aria-labelledby="h-defect-list">
                <div className="card__head">
                    <h2 id="h-defect-list">Defects</h2>
                    {canReport ? (
                        <button
                            type="button"
                            className="btn btn--primary"
                            onClick={() => {
                                setNotice(null)
                                setReporting(true)
                            }}
                        >
                            <Icon name="wrench" size={16} /> Report a defect
                        </button>
                    ) : null}
                </div>

                <ViewTabs
                    label="Defect views"
                    idPrefix="defect-view"
                    tabs={views.map((v) => ({ id: v, label: VIEW_LABEL[v], count: counts[v] }))}
                    active={view}
                    onChange={(v) => {
                        setView(v)
                        setShowAll(false)
                    }}
                />

                <div {...tabPanelProps('defect-view', view)}>
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
                            <span>Priority</span>
                            <select
                                value={priority}
                                onChange={(e) => {
                                    const v = e.target.value
                                    if (v === 'all' || (DEFECT_PRIORITY_ORDER as string[]).includes(v)) setPriority(v as PriorityFilter)
                                }}
                            >
                                <option value="all">All</option>
                                {DEFECT_PRIORITY_ORDER.map((p) => (
                                    <option key={p} value={p}>
                                        {DEFECT_PRIORITY_META[p].label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <p className="muted" role="status">
                        {note} Showing {visible.length} of {rows.length} defects.
                    </p>

                    {rows.length === 0 ? (
                        <EmptyState
                            title={allRows.length === 0 ? 'No defects to show' : 'Nothing here'}
                            message={allRows.length === 0 ? 'No defects are currently visible to your role.' : 'No defects match this view and filter.'}
                        />
                    ) : (
                        <>
                            <div className="table-wrap">
                                <table className="table table--stack">
                                    <caption className="sr-only">{VIEW_LABEL[view]}: defects, most urgent first</caption>
                                    <thead>
                                        <tr>
                                            <th scope="col">Room</th>
                                            <th scope="col">Problem</th>
                                            <th scope="col">Priority</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Technician</th>
                                            <th scope="col">
                                                <span className="sr-only">Action</span>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visible.map(({ defect }) => (
                                            <tr key={defect.id}>
                                                <th scope="row">{defect.roomId}</th>
                                                <td className="table__task" data-label="Problem">
                                                    {/* Defect text is untrusted input; React renders it as plain text. */}
                                                    <span className="table__task-title">{defect.title}</span>
                                                    <span className="muted table__sub">
                                                        Reported by {staffName.get(defect.reportedById) ?? 'Unknown'}, {formatAgo(defect.reportedAt, snapshot.generatedAt)}
                                                    </span>
                                                </td>
                                                <td data-label="Priority">
                                                    <DefectPriorityBadge priority={defect.priority} />
                                                </td>
                                                <td data-label="Status">
                                                    <DefectStatusBadge status={defect.status} />
                                                </td>
                                                <td data-label="Technician">
                                                    {defect.technicianId ? (staffName.get(defect.technicianId) ?? 'Unknown') : <span className="muted">Unassigned</span>}
                                                </td>
                                                <td data-label="Action">
                                                    <button
                                                        type="button"
                                                        className="btn btn--ghost btn--small btn--flat"
                                                        aria-label={`${actionLabel(defect)}: ${defect.title}, Room ${defect.roomId}`}
                                                        onClick={() => setOpenId(defect.id)}
                                                    >
                                                        {actionLabel(defect)}
                                                    </button>
                                                </td>
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
                </div>
            </section>

            {reporting ? (
                <ReportDefectDialog
                    rooms={role === 'supervisor' ? data.allViews : scoped.views}
                    staff={snapshot.staff}
                    onClose={() => setReporting(false)}
                    onDone={(message) => {
                        setReporting(false)
                        setNotice(message)
                    }}
                />
            ) : null}
            {openId ? <DefectModal defectId={openId} data={data} onClose={closeModal} /> : null}
        </div>
    )
}
