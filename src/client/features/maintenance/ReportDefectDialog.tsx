import React, { useState } from 'react'
import { LIMITS, SEVERITIES, validateDefectReport } from '../../domain/validation'
import type { DefectReportValue } from '../../domain/validation'
import { SEVERITY_META } from '../../domain/labels'
import type { RoomView } from '../../types/domain'
import { Badge, SeverityBadge } from '../../components/ui/Badge'
import { Banner } from '../../components/ui/Banner'
import { Dialog } from '../../components/ui/Dialog'
import { CheckboxInput, ErrorSummary, SelectInput, TextArea, TextInput } from '../../components/ui/FormFields'

interface Props {
    rooms: RoomView[]
    onClose: () => void
}

const FIELD_IDS = { roomId: 'defect-room', title: 'defect-title', description: 'defect-description', severity: 'defect-severity' }

/**
 * Defect report form. It validates input and shows what WOULD be sent, but it does not
 * save anything: there is no ServiceNow table or API behind it yet (Phase 4).
 */
export function ReportDefectDialog({ rooms, onClose }: Props) {
    const [roomId, setRoomId] = useState('')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [severity, setSeverity] = useState('medium')
    const [blocking, setBlocking] = useState(false)
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [accepted, setAccepted] = useState<DefectReportValue | null>(null)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const result = validateDefectReport(
            { roomId, title, description, severity, blocking },
            rooms.map((r) => r.room.id)
        )
        if (!result.ok) {
            setErrors(result.errors)
            return
        }
        setErrors({})
        setAccepted(result.value)
    }

    return (
        <Dialog title="Report a maintenance defect" onClose={onClose}>
            <Banner tone="warning">
                <strong>Simulation only.</strong> Your report is checked but NOT saved. Saving will use a ServiceNow table in a
                later phase.
            </Banner>

            {accepted ? (
                <div className="dialog__body">
                    <p>Validation passed. In the live app this is what would be sent to the server for its own checks:</p>
                    <dl className="facts facts--stacked review-list">
                        <div>
                            <dt>Room</dt>
                            <dd>{accepted.roomId}</dd>
                        </div>
                        <div>
                            <dt>Problem</dt>
                            <dd>{accepted.title}</dd>
                        </div>
                        <div>
                            <dt>Description</dt>
                            <dd className="preserve-lines">{accepted.description}</dd>
                        </div>
                        <div>
                            <dt>Severity and readiness</dt>
                            <dd className="badge-row">
                                <SeverityBadge severity={accepted.severity as DefectReportValue['severity']} />
                                {accepted.blocking ? (
                                    <Badge tone="danger" label="Blocks readiness" icon="lock" />
                                ) : (
                                    <Badge tone="neutral" label="Does not block readiness" />
                                )}
                            </dd>
                        </div>
                    </dl>
                    <div className="dialog__actions">
                        <button type="button" className="btn btn--primary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} noValidate className="form">
                    <ErrorSummary errors={errors} fieldIds={FIELD_IDS} />
                    <SelectInput
                        id={FIELD_IDS.roomId}
                        label="Room"
                        required
                        value={roomId}
                        placeholder="Choose a room"
                        error={errors.roomId}
                        options={rooms.map((r) => ({ value: r.room.id, label: `Room ${r.room.id} (floor ${r.room.floor})` }))}
                        onChange={setRoomId}
                    />
                    <TextInput
                        id={FIELD_IDS.title}
                        label="Problem title"
                        required
                        hint={`${LIMITS.defectTitleMin} to ${LIMITS.defectTitleMax} characters.`}
                        value={title}
                        maxLength={LIMITS.defectTitleMax}
                        error={errors.title}
                        onChange={setTitle}
                    />
                    <TextArea
                        id={FIELD_IDS.description}
                        label="Description"
                        required
                        hint="What is wrong and where? Do not include guest names or personal details."
                        value={description}
                        maxLength={LIMITS.defectDescriptionMax}
                        error={errors.description}
                        onChange={setDescription}
                    />
                    <SelectInput
                        id={FIELD_IDS.severity}
                        label="Severity"
                        required
                        value={severity}
                        error={errors.severity}
                        options={SEVERITIES.map((s) => ({ value: s, label: SEVERITY_META[s].label }))}
                        onChange={setSeverity}
                    />
                    <CheckboxInput
                        id="defect-blocking"
                        label="This defect blocks room readiness"
                        hint="A supervisor and the server decide the final blocking status."
                        checked={blocking}
                        onChange={setBlocking}
                    />
                    <div className="dialog__actions">
                        <button type="submit" className="btn btn--primary">
                            Check report
                        </button>
                        <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                            Cancel
                        </button>
                    </div>
                </form>
            )}
        </Dialog>
    )
}
