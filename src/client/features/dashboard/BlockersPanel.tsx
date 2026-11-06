import React from 'react'
import { DEFECT_STATUS_LABEL } from '../../domain/labels'
import { formatAgo } from '../../domain/format'
import type { PriorityBlocker } from '../../domain/selectors'
import { SeverityBadge } from '../../components/ui/Badge'
import { Icon } from '../../components/ui/Icon'

interface Props {
    blockers: PriorityBlocker[]
    nowIso: string
}

export function BlockersPanel({ blockers, nowIso }: Props) {
    if (blockers.length === 0) {
        return (
            <p className="panel-empty">
                <Icon name="check-circle" size={18} /> No high-priority blockers in this view.
            </p>
        )
    }

    return (
        <ul className="blockers">
            {blockers.map(({ defect, roomId, technician }) => (
                <li key={defect.id} className="blockers__item">
                    <div className="blockers__head">
                        <a className="link" href={`#/rooms/${encodeURIComponent(roomId)}`}>
                            Room {roomId}
                        </a>
                        <SeverityBadge severity={defect.severity} />
                    </div>
                    {/* Defect text is untrusted user input; React renders it as plain text. */}
                    <p className="blockers__title">{defect.title}</p>
                    <p className="blockers__meta muted">
                        {DEFECT_STATUS_LABEL[defect.status]} · {technician ? technician.name : 'Unassigned'} · reported{' '}
                        {formatAgo(defect.reportedAt, nowIso)}
                    </p>
                </li>
            ))}
        </ul>
    )
}
