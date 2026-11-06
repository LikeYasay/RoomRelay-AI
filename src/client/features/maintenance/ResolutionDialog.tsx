import React, { useState } from 'react'
import { LIMITS, validateResolution } from '../../domain/validation'
import type { Defect } from '../../types/domain'
import { Banner } from '../../components/ui/Banner'
import { Dialog } from '../../components/ui/Dialog'
import { ErrorSummary, TextArea } from '../../components/ui/FormFields'

interface Props {
    defect: Defect
    onClose: () => void
}

/** Resolution notes form. Validates only; nothing is saved until the ServiceNow backend exists (Phase 4). */
export function ResolutionDialog({ defect, onClose }: Props) {
    const [notes, setNotes] = useState('')
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [accepted, setAccepted] = useState<string | null>(null)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const result = validateResolution(notes)
        if (!result.ok) {
            setErrors(result.errors)
            return
        }
        setErrors({})
        setAccepted(result.value.notes)
    }

    return (
        <Dialog title={`Record resolution: Room ${defect.roomId}`} onClose={onClose}>
            <Banner tone="warning">
                <strong>Simulation only.</strong> Your notes are checked but NOT saved, and the defect status does not change.
            </Banner>
            {/* Defect text is untrusted input; React renders it as plain text. */}
            <p className="dialog__body">
                <strong>{defect.title}</strong>
            </p>
            {accepted ? (
                <div className="dialog__body">
                    <p>Validation passed. The server would also check that you are the assigned technician.</p>
                    <p className="preserve-lines review-note">{accepted}</p>
                    <div className="dialog__actions">
                        <button type="button" className="btn btn--primary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            ) : (
                <form onSubmit={submit} noValidate className="form">
                    <ErrorSummary errors={errors} fieldIds={{ notes: 'resolution-notes' }} />
                    <TextArea
                        id="resolution-notes"
                        label="Resolution notes"
                        required
                        hint="Describe the fix and how it was tested."
                        value={notes}
                        maxLength={LIMITS.resolutionMax}
                        error={errors.notes}
                        onChange={setNotes}
                    />
                    <div className="dialog__actions">
                        <button type="submit" className="btn btn--primary">
                            Check notes
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
