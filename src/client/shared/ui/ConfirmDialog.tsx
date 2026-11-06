import React, { useState } from 'react'
import { Banner } from './Banner'
import { Dialog } from './Dialog'

interface Props {
    title: string
    message: string
    confirmLabel: string
    /** Runs the action. Resolves with an error message to show, or undefined on success. */
    onConfirm: () => Promise<string | undefined>
    onClose: () => void
}

/** Asks before an action that changes data. Shows the rule's message if the action is refused. */
export function ConfirmDialog({ title, message, confirmLabel, onConfirm, onClose }: Props) {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState<string | undefined>()

    const confirm = async () => {
        if (busy) return // ignore double clicks
        setBusy(true)
        setError(undefined)
        const failure = await onConfirm()
        setBusy(false)
        if (failure) setError(failure)
        else onClose()
    }

    return (
        <Dialog title={title} onClose={onClose}>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            <p className="dialog__body">{message}</p>
            <div className="dialog__actions">
                <button type="button" className="btn btn--primary" onClick={confirm} aria-disabled={busy}>
                    {busy ? 'Saving...' : confirmLabel}
                </button>
                <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                    Cancel
                </button>
            </div>
        </Dialog>
    )
}
