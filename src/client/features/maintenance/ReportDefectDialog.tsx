import React, { useState } from 'react'
import { useSession } from '../auth/session'
import { useCommands } from '../../shared/api/DataContext'
import { DEFECT_PRIORITY_META } from '../../shared/domain/labels'
import type { DefectPriority, RoomView, Staff } from '../../shared/domain/types'
import { Banner } from '../../shared/ui/Banner'
import { Dialog } from '../../shared/ui/Dialog'
import { ErrorSummary, SelectInput, TextArea, TextInput } from '../../shared/ui/FormFields'
import { DEFECT_PRIORITIES, LIMITS, validateDefectReport } from './defectValidation'

interface Props {
    /** Rooms the user may report against. */
    rooms: RoomView[]
    staff: Staff[]
    /** Pre-selects a room, for example when opened from a room's page. */
    roomId?: string
    onClose: () => void
    onDone: (message: string) => void
}

const FIELD_IDS = {
    roomId: 'defect-room',
    title: 'defect-title',
    description: 'defect-description',
    priority: 'defect-priority',
    technicianId: 'defect-technician',
}

/**
 * Report a defect. A housekeeper's report starts as New with priority Normal; a supervisor
 * triages it later. A supervisor reporting directly may set the priority and assign a technician.
 */
export function ReportDefectDialog({ rooms, staff, roomId: initialRoom, onClose, onDone }: Props) {
    const { role } = useSession()
    const { run } = useCommands()
    const canTriage = role === 'supervisor'
    const technicians = staff.filter((s) => s.role === 'maintenance')

    const [roomId, setRoomId] = useState(initialRoom ?? '')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [priority, setPriority] = useState<string>('normal')
    const [technicianId, setTechnicianId] = useState('')
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [failure, setFailure] = useState<string | undefined>()
    const [busy, setBusy] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (busy) return
        const checked = validateDefectReport(
            { roomId, title, description, priority: canTriage ? priority : '', technicianId: canTriage ? technicianId : '' },
            { allowedRoomIds: rooms.map((r) => r.room.id), technicianIds: technicians.map((t) => t.id) }
        )
        if (!checked.ok) {
            setErrors(checked.errors)
            return
        }
        setErrors({})
        setBusy(true)
        const v = checked.value
        const outcome = await run({
            type: 'defect.report',
            roomId: v.roomId,
            title: v.title,
            description: v.description,
            // Only a supervisor may send these. The rule (and the server) rejects them from anyone else.
            ...(canTriage ? { priority: v.priority as DefectPriority, technicianId: v.technicianId } : {}),
        })
        setBusy(false)
        if (!outcome.ok) {
            setFailure(outcome.message)
            if (outcome.fieldErrors) setErrors(outcome.fieldErrors)
            return
        }
        onDone(
            canTriage && v.technicianId
                ? `Defect reported for Room ${v.roomId} and assigned.`
                : `Defect reported for Room ${v.roomId}. A supervisor will assign a technician.`
        )
    }

    return (
        <Dialog title="Report a maintenance defect" onClose={onClose}>
            {failure ? <Banner tone="danger">{failure}</Banner> : null}
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
                {canTriage ? (
                    <>
                        <SelectInput
                            id={FIELD_IDS.priority}
                            label="Priority"
                            required
                            hint="Only Blocking stops the room from being Ready."
                            value={priority}
                            error={errors.priority}
                            options={DEFECT_PRIORITIES.map((p) => ({ value: p, label: DEFECT_PRIORITY_META[p].label }))}
                            onChange={setPriority}
                        />
                        <SelectInput
                            id={FIELD_IDS.technicianId}
                            label="Technician"
                            hint="Optional. Leave empty to assign later from New reports."
                            value={technicianId}
                            placeholder="Not assigned yet"
                            error={errors.technicianId}
                            options={technicians.map((t) => ({ value: t.id, label: t.name }))}
                            onChange={setTechnicianId}
                        />
                    </>
                ) : (
                    <p className="muted">Your report starts as New. A supervisor sets its priority and assigns a technician.</p>
                )}
                <div className="dialog__actions">
                    <button type="submit" className="btn btn--primary" aria-disabled={busy}>
                        {busy ? 'Sending...' : 'Report defect'}
                    </button>
                    <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </Dialog>
    )
}
