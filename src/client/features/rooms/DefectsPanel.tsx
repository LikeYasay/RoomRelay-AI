import React from 'react'
import { formatAgo } from '../../domain/format'
import type { Defect } from '../../types/domain'
import { Badge, DefectStatusBadge, SeverityBadge } from '../../components/ui/Badge'

interface Props {
    defects: Defect[]
    technicians: Map<string, string>
    nowIso: string
}

export function DefectsPanel({ defects, technicians, nowIso }: Props) {
    return (
        <section className="card" aria-labelledby="h-defects">
            <h2 id="h-defects">Maintenance defects</h2>
            {defects.length === 0 ? (
                <p className="panel-empty">No defects recorded for this room.</p>
            ) : (
                <ul className="defects">
                    {defects.map((d) => (
                        <li key={d.id} className="defect">
                            <div className="defect__head">
                                {/* Defect text is untrusted input; React renders it as plain text. */}
                                <p className="defect__title">{d.title}</p>
                                <div className="defect__badges">
                                    <SeverityBadge severity={d.severity} />
                                    {d.blocking ? (
                                        <Badge tone="danger" label="Blocks readiness" icon="lock" />
                                    ) : (
                                        <Badge tone="neutral" label="Does not block readiness" />
                                    )}
                                    <DefectStatusBadge status={d.status} />
                                </div>
                            </div>
                            <p className="muted">{d.description}</p>
                            <p className="muted defect__meta">
                                Technician: {d.technicianId ? (technicians.get(d.technicianId) ?? 'Unknown') : 'Unassigned'} · reported{' '}
                                {formatAgo(d.reportedAt, nowIso)}
                                {d.resolvedAt ? ` · resolved ${formatAgo(d.resolvedAt, nowIso)}` : ''}
                            </p>
                            {d.resolutionNotes ? (
                                <p className="defect__resolution">
                                    <strong>Resolution:</strong> {d.resolutionNotes}
                                </p>
                            ) : null}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
