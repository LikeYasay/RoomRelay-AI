import React, { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface DialogProps {
    title: string
    onClose: () => void
    children: ReactNode
}

/**
 * Modal built on the native <dialog> element, which provides focus trapping,
 * Escape-to-close and focus return to the opener without extra code.
 */
export function Dialog({ title, onClose, children }: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const dialog = ref.current
        if (dialog && !dialog.open) dialog.showModal()
        return () => {
            if (dialog?.open) dialog.close()
        }
    }, [])

    return (
        <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onClose={onClose}>
            <h2 id="dialog-title">{title}</h2>
            {children}
        </dialog>
    )
}
