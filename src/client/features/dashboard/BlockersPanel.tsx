import React from 'react'
import { useSession } from '../auth/session'
import { DefectStatusBadge } from '../../shared/domain/StatusBadges'
import { formatAgo } from '../../shared/lib/format'
import { Icon } from '../../shared/ui/Icon'
import type { BlockingDefect } from '../maintenance/blockers'

interface Props {
    blockers: BlockingDefect[]
    nowIso: string
}

/** Unresolved Blocking defects: the only defects that stop a room from being Ready. */
export function BlockersPanel({ blockers, nowIso }: Props) {
    const { role } = useSession()

    if (blockers.length === 0) {
        return (
            <p className="panel-empty">
                <Icon name="check-circle" size={18} /> No blocking defects in this view.
            </p>
        )
    }

    return (
        <ul className="blockers">
            {blockers.map(({ defect, roomId, technician }) => (
                <li key={defect.id} className="blockers__item">
                    <div className="blockers__head">
                        {role === 'maintenance' ? (
                            <span>Room {roomId}</span>
                        ) : (
                            <a className="link" href={`#/rooms/${encodeURIComponent(roomId)}`}>
                                Room {roomId}
                            </a>
                        )}
                        <DefectStatusBadge status={defect.status} />
                    </div>
                    {/* Defect text is untrusted user input; React renders it as plain text. */}
                    <p className="blockers__title">
                        <a className="link" href={`#/maintenance/${encodeURIComponent(defect.id)}`}>
                            {defect.title}
                        </a>
                    </p>
                    <p className="blockers__meta muted">
                        {technician ? technician.name : 'Unassigned'} · reported {formatAgo(defect.reportedAt, nowIso)}
                    </p>
                </li>
            ))}
        </ul>
    )
}
