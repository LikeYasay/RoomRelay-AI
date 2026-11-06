import React, { useState } from 'react'
import { useCommands } from '../../shared/api/DataContext'
import { INCOMPLETE_REASON_LABEL, INCOMPLETE_REASONS } from '../../shared/domain/labels'
import type { HousekeepingTask } from '../../shared/domain/types'
import { Banner } from '../../shared/ui/Banner'
import { Dialog } from '../../shared/ui/Dialog'
import { ErrorSummary, SelectInput, TextArea } from '../../shared/ui/FormFields'
import { NOTE_LIMITS, validateIncomplete } from './taskValidation'

interface Props {
    task: HousekeepingTask
    onClose: () => void
    onDone: (message: string) => void
}

const FIELD_IDS = { reason: 'incomplete-reason', note: 'incomplete-note' }

/** Marks a task "Couldn't Complete" with a reason. "Needs maintenance" also files a report for a supervisor. */
export function CouldntCompleteDialog({ task, onClose, onDone }: Props) {
    const { run } = useCommands()
    const [reason, setReason] = useState('')
    const [note, setNote] = useState('')
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [failure, setFailure] = useState<string | undefined>()
    const [busy, setBusy] = useState(false)

    const submit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (busy) return
        const checked = validateIncomplete({ reason, note })
        if (!checked.ok) {
            setErrors(checked.errors)
            return
        }
        setErrors({})
        setBusy(true)
        const outcome = await run({ type: 'task.couldntComplete', taskId: task.id, reason: checked.value.reason, note: checked.value.note })
        setBusy(false)
        if (!outcome.ok) {
            setFailure(outcome.message)
            if (outcome.fieldErrors) setErrors(outcome.fieldErrors)
            return
        }
        onDone(
            checked.value.reason === 'needs_maintenance'
                ? `"${task.title}" is marked Couldn't Complete. A maintenance report was sent to the supervisor.`
                : `"${task.title}" is marked Couldn't Complete.`
        )
    }

    return (
        <Dialog title="Couldn't complete this task" onClose={onClose}>
            {/* Task text is untrusted input; React renders it as plain text. */}
            <p className="dialog__body">
                <strong>{task.title}</strong>
            </p>
            {failure ? <Banner tone="danger">{failure}</Banner> : null}
            <form onSubmit={submit} noValidate className="form">
                <ErrorSummary errors={errors} fieldIds={FIELD_IDS} />
                <SelectInput
                    id={FIELD_IDS.reason}
                    label="Reason"
                    required
                    value={reason}
                    placeholder="Choose a reason"
                    error={errors.reason}
                    options={INCOMPLETE_REASONS.map((r) => ({ value: r, label: INCOMPLETE_REASON_LABEL[r] }))}
                    onChange={setReason}
                />
                {reason === 'needs_maintenance' ? (
                    <Banner tone="info">
                        This creates a maintenance report. A supervisor assigns a technician. When the repair is recorded, this
                        task goes back to Pending for you to finish.
                    </Banner>
                ) : null}
                <TextArea
                    id={FIELD_IDS.note}
                    label="Note"
                    required={reason === 'other'}
                    hint={
                        reason === 'other'
                            ? 'Required. Explain what stopped you.'
                            : 'Optional. What is wrong? Do not include guest names or personal details.'
                    }
                    value={note}
                    maxLength={NOTE_LIMITS.max}
                    error={errors.note}
                    onChange={setNote}
                />
                <p className="muted">A mandatory task that cannot be completed keeps the room from being Ready.</p>
                <div className="dialog__actions">
                    <button type="submit" className="btn btn--primary" aria-disabled={busy}>
                        {busy ? 'Saving...' : "Mark as Couldn't Complete"}
                    </button>
                    <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </form>
        </Dialog>
    )
}
