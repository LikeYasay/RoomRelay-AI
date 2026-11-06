import React, { useState } from 'react'
import { useSession } from '../auth/session'
import type { ReadyData } from '../../shared/api/DataContext'
import { DefectPriorityBadge, DefectStatusBadge } from '../../shared/domain/StatusBadges'
import type { Defect, RoomView } from '../../shared/domain/types'
import { formatAgo } from '../../shared/lib/format'
import { Banner } from '../../shared/ui/Banner'
import { Icon } from '../../shared/ui/Icon'
import { DefectModal } from '../maintenance/DefectModal'
import { ReportDefectDialog } from '../maintenance/ReportDefectDialog'

interface Props {
    view: RoomView
    data: ReadyData
}

/** The room's defects. "Details" opens the same defect modal as the Maintenance page. */
export function DefectsPanel({ view, data }: Props) {
    const { role, user } = useSession()
    const [openId, setOpenId] = useState<string | null>(null)
    const [reporting, setReporting] = useState(false)
    const [notice, setNotice] = useState<string | null>(null)
    const { defects, room } = view
    const now = data.snapshot.generatedAt
    const name = (id: string | undefined) => (id ? (data.snapshot.staff.find((s) => s.id === id)?.name ?? 'Unknown') : 'Unassigned')

    const canReport = role === 'supervisor' || (role === 'housekeeping' && room.assigneeId === user.id)
    const sorted: Defect[] = [...defects].sort((a, b) => Number(a.status === 'resolved') - Number(b.status === 'resolved') || b.reportedAt.localeCompare(a.reportedAt))

    return (
        <section className="card" aria-labelledby="h-defects">
            <div className="card__head">
                <h2 id="h-defects">Maintenance defects</h2>
                {canReport ? (
                    <button
                        type="button"
                        className="btn btn--ghost btn--small btn--flat"
                        onClick={() => {
                            setNotice(null)
                            setReporting(true)
                        }}
                    >
                        <Icon name="wrench" size={16} /> Report a defect
                    </button>
                ) : null}
            </div>

            {notice ? (
                <div role="status">
                    <Banner tone="info">{notice}</Banner>
                </div>
            ) : null}

            {sorted.length === 0 ? (
                <p className="panel-empty">No defects recorded for this room.</p>
            ) : (
                <ul className="defects">
                    {sorted.map((d) => (
                        <li key={d.id} className="defect">
                            <div className="defect__head">
                                {/* Defect text is untrusted input; React renders it as plain text. */}
                                <p className="defect__title">{d.title}</p>
                                <div className="defect__badges">
                                    <DefectPriorityBadge priority={d.priority} />
                                    <DefectStatusBadge status={d.status} />
                                </div>
                            </div>
                            <p className="muted defect__meta">
                                Technician: {name(d.technicianId)} · reported {formatAgo(d.reportedAt, now)}
                                {d.resolvedAt ? ` · resolved ${formatAgo(d.resolvedAt, now)}` : ''}
                            </p>
                            <button type="button" className="link-button defect__open" onClick={() => setOpenId(d.id)}>
                                Details<span className="sr-only">: {d.title}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {openId ? <DefectModal defectId={openId} data={data} onClose={() => setOpenId(null)} /> : null}
            {reporting ? (
                <ReportDefectDialog
                    rooms={[view]}
                    staff={data.snapshot.staff}
                    roomId={room.id}
                    onClose={() => setReporting(false)}
                    onDone={(message) => {
                        setReporting(false)
                        setNotice(message)
                    }}
                />
            ) : null}
        </section>
    )
}
