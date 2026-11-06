import React, { useMemo, useState } from 'react'
import { useSession } from '../auth/session'
import { useCommands } from '../../shared/api/DataContext'
import type { ReadyData } from '../../shared/api/DataContext'
import { AUDIT_ACTION_META, DEFECT_PRIORITY_META, TASK_STATUS_META } from '../../shared/domain/labels'
import { DefectPriorityBadge, DefectStatusBadge } from '../../shared/domain/StatusBadges'
import type { Defect } from '../../shared/domain/types'
import { formatAgo, formatDateTime } from '../../shared/lib/format'
import { Banner } from '../../shared/ui/Banner'
import { Dialog } from '../../shared/ui/Dialog'
import { ErrorSummary, SelectInput, TextArea } from '../../shared/ui/FormFields'
import { Icon } from '../../shared/ui/Icon'
import { DEFECT_PRIORITIES, LIMITS, validateResolution, validateTriage } from './defectValidation'
import { scopeDefectsForRole } from './scope'

interface Props {
    defectId: string
    data: ReadyData
    onClose: () => void
}

/**
 * Everything about one defect in one place: details, history, the room's other defects, and the
 * actions the signed-in role may take (supervisor: triage; technician: start and resolve).
 */
export function DefectModal({ defectId: initialId, data, onClose }: Props) {
    const { role, user } = useSession()
    const [defectId, setDefectId] = useState(initialId)
    const { snapshot, scoped } = data

    // Only defects this role may see. A defect outside that scope looks the same as one that does not exist.
    const visible = useMemo(() => scopeDefectsForRole(scoped.views, role, user).rows.map((r) => r.defect), [scoped, role, user])
    const defect = visible.find((d) => d.id === defectId)
    const name = (id: string | undefined) => (id ? (snapshot.staff.find((s) => s.id === id)?.name ?? 'Unknown') : 'Unassigned')

    if (!defect) {
        return (
            <Dialog title="Defect unavailable" onClose={onClose}>
                <p className="dialog__body">This defect does not exist or you do not have permission to view it.</p>
                <div className="dialog__actions">
                    <button type="button" className="btn btn--primary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </Dialog>
        )
    }

    const sourceTask = defect.sourceTaskId ? snapshot.tasks.find((t) => t.id === defect.sourceTaskId) : undefined
    const others = visible.filter((d) => d.roomId === defect.roomId && d.id !== defect.id)
    const history = snapshot.audit.filter((e) => e.targetId === defect.id).sort((a, b) => b.at.localeCompare(a.at))
    const now = snapshot.generatedAt

    return (
        <Dialog title={`Room ${defect.roomId}: defect details`} wide onClose={onClose}>
            <div className="defect-modal">
                {/* Defect text is untrusted input; React renders it as plain text. */}
                <p className="defect-modal__title">{defect.title}</p>
                <p className="badge-row">
                    <DefectPriorityBadge priority={defect.priority} />
                    <DefectStatusBadge status={defect.status} />
                </p>
                {defect.priority === 'blocking' && defect.status !== 'resolved' ? (
                    <p className="defect-modal__impact">
                        <Icon name="lock" size={14} /> Room {defect.roomId} cannot be Ready until this is resolved.
                    </p>
                ) : null}

                <p className="preserve-lines">{defect.description}</p>

                <dl className="facts facts--stacked">
                    <div>
                        <dt>Room</dt>
                        <dd>
                            {role === 'maintenance' ? (
                                defect.roomId
                            ) : (
                                <a className="link" href={`#/rooms/${encodeURIComponent(defect.roomId)}`} onClick={onClose}>
                                    Room {defect.roomId}
                                </a>
                            )}
                        </dd>
                    </div>
                    <div>
                        <dt>Reported</dt>
                        <dd>
                            {name(defect.reportedById)}, {formatAgo(defect.reportedAt, now)}
                        </dd>
                    </div>
                    <div>
                        <dt>Technician</dt>
                        <dd>
                            {name(defect.technicianId)}
                            {defect.assignedAt ? <span className="muted"> · assigned by {name(defect.assignedById)}, {formatAgo(defect.assignedAt, now)}</span> : null}
                        </dd>
                    </div>
                    {sourceTask ? (
                        <div>
                            <dt>Raised from task</dt>
                            <dd>
                                {sourceTask.title} <span className="muted">({TASK_STATUS_META[sourceTask.status].label})</span>
                            </dd>
                        </div>
                    ) : null}
                    {defect.resolvedAt ? (
                        <div>
                            <dt>Resolved</dt>
                            <dd>{formatDateTime(defect.resolvedAt)}</dd>
                        </div>
                    ) : null}
                </dl>

                {defect.resolutionNotes ? (
                    <p className="defect__resolution">
                        <strong>Resolution:</strong> <span className="preserve-lines">{defect.resolutionNotes}</span>
                    </p>
                ) : null}

                <DefectActions defect={defect} data={data} />

                {others.length > 0 ? (
                    <section aria-labelledby="h-other-defects">
                        <h3 id="h-other-defects" className="defect-modal__heading">
                            Other defects in Room {defect.roomId}
                        </h3>
                        <ul className="defect-modal__others">
                            {others.map((d) => (
                                <li key={d.id}>
                                    <button type="button" className="link-button" onClick={() => setDefectId(d.id)}>
                                        {d.title}
                                    </button>{' '}
                                    <span className="muted">
                                        {DEFECT_PRIORITY_META[d.priority].label} · {d.status === 'resolved' ? 'Resolved' : 'Open'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                ) : null}

                <section aria-labelledby="h-defect-history">
                    <h3 id="h-defect-history" className="defect-modal__heading">
                        History
                    </h3>
                    {history.length === 0 ? (
                        <p className="panel-empty">No history yet.</p>
                    ) : (
                        <ol className="defect-modal__history">
                            {history.map((e) => (
                                <li key={e.id}>
                                    <span className="muted">{formatAgo(e.at, now)}</span> · {AUDIT_ACTION_META[e.action].label}: {e.summary}
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <div className="dialog__actions">
                    <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </Dialog>
    )
}

/** The actions part of the modal, by role. */
function DefectActions({ defect, data }: { defect: Defect; data: ReadyData }) {
    const { role, user } = useSession()
    if (defect.status === 'resolved') return null
    if (role === 'supervisor') return <TriageForm key={defect.id} defect={defect} data={data} />
    if (role === 'maintenance' && defect.technicianId === user.id) return <TechnicianForm key={defect.id} defect={defect} />
    return (
        <p className="muted defect-modal__readonly">
            {role === 'housekeeping'
                ? 'A supervisor assigns a technician. You can follow progress here.'
                : 'View only. Supervisors triage defects and technicians record repairs.'}
        </p>
    )
}

function TriageForm({ defect, data }: { defect: Defect; data: ReadyData }) {
    const { run } = useCommands()
    const technicians = data.snapshot.staff.filter((s) => s.role === 'maintenance')
    const [technicianId, setTechnicianId] = useState(defect.technicianId ?? '')
    const [priority, setPriority] = useState<string>(defect.priority)
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [message, setMessage] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null)
    const [busy, setBusy] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (busy) return
        const checked = validateTriage({ technicianId, priority }, technicians.map((t) => t.id))
        if (!checked.ok) {
            setErrors(checked.errors)
            return
        }
        setErrors({})
        setBusy(true)
        const outcome = await run({ type: 'defect.triage', defectId: defect.id, ...checked.value })
        setBusy(false)
        setMessage(outcome.ok ? { tone: 'info', text: 'Saved. The technician sees this in their queue.' } : { tone: 'danger', text: outcome.message })
    }

    return (
        <form className="form defect-modal__form" onSubmit={submit} noValidate>
            <h3 className="defect-modal__heading">{defect.status === 'new' ? 'Triage this report' : 'Reassign or change priority'}</h3>
            {message ? (
                <div role="status">
                    <Banner tone={message.tone}>{message.text}</Banner>
                </div>
            ) : null}
            <ErrorSummary errors={errors} fieldIds={{ technicianId: 'triage-technician', priority: 'triage-priority' }} />
            <SelectInput
                id="triage-technician"
                label="Technician"
                required
                value={technicianId}
                placeholder="Choose a technician"
                error={errors.technicianId}
                options={technicians.map((t) => ({ value: t.id, label: t.name }))}
                onChange={setTechnicianId}
            />
            <SelectInput
                id="triage-priority"
                label="Priority"
                required
                hint="Only Blocking stops the room from being Ready."
                value={priority}
                error={errors.priority}
                options={DEFECT_PRIORITIES.map((p) => ({ value: p, label: DEFECT_PRIORITY_META[p].label }))}
                onChange={setPriority}
            />
            <div className="dialog__actions">
                <button type="submit" className="btn btn--primary" aria-disabled={busy}>
                    {busy ? 'Saving...' : defect.status === 'new' ? 'Assign' : 'Save changes'}
                </button>
            </div>
        </form>
    )
}

function TechnicianForm({ defect }: { defect: Defect }) {
    const { run } = useCommands()
    const [notes, setNotes] = useState('')
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [message, setMessage] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null)
    const [busy, setBusy] = useState(false)

    const start = async () => {
        if (busy) return
        setBusy(true)
        const outcome = await run({ type: 'defect.start', defectId: defect.id })
        setBusy(false)
        setMessage(outcome.ok ? { tone: 'info', text: 'Work started.' } : { tone: 'danger', text: outcome.message })
    }

    const resolve = async (e: React.FormEvent) => {
        e.preventDefault()
        if (busy) return
        const checked = validateResolution(notes)
        if (!checked.ok) {
            setErrors(checked.errors)
            return
        }
        setErrors({})
        setBusy(true)
        const outcome = await run({ type: 'defect.resolve', defectId: defect.id, notes: checked.value.notes })
        setBusy(false)
        if (!outcome.ok) setMessage({ tone: 'danger', text: outcome.message })
    }

    return (
        <div className="defect-modal__form">
            {message ? (
                <div role="status">
                    <Banner tone={message.tone}>{message.text}</Banner>
                </div>
            ) : null}
            {defect.status === 'assigned' ? (
                <div className="dialog__actions">
                    <button type="button" className="btn btn--ghost btn--flat" aria-disabled={busy} onClick={start}>
                        <Icon name="wrench" size={16} /> Start work
                    </button>
                </div>
            ) : null}
            <form className="form" onSubmit={resolve} noValidate>
                <h3 className="defect-modal__heading">Record the repair</h3>
                <ErrorSummary errors={errors} fieldIds={{ notes: 'resolution-notes' }} />
                <TextArea
                    id="resolution-notes"
                    label="Resolution notes"
                    required
                    hint={`Describe the fix and how it was tested (${LIMITS.resolutionMin} to ${LIMITS.resolutionMax} characters).`}
                    value={notes}
                    maxLength={LIMITS.resolutionMax}
                    error={errors.notes}
                    onChange={setNotes}
                />
                <div className="dialog__actions">
                    <button type="submit" className="btn btn--primary" aria-disabled={busy}>
                        {busy ? 'Saving...' : 'Mark resolved'}
                    </button>
                </div>
            </form>
        </div>
    )
}
