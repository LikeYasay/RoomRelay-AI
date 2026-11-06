import React, { useState } from 'react'
import { Banner } from './Banner'
import { Dialog } from './Dialog'

interface Props {
    title: string
    /** Explains what the real action would do. */
    intro: string
    /** What the screen reports after the simulation runs. */
    result: string
    onClose: () => void
}

/** Two-step "run a simulation" dialog. Nothing is read or changed in ServiceNow. */
export function SimulationDialog({ title, intro, result, onClose }: Props) {
    const [ran, setRan] = useState(false)

    return (
        <Dialog title={title} onClose={onClose}>
            <Banner tone="warning">
                <strong>Simulation only.</strong> No ServiceNow record is read or changed.
            </Banner>
            <p className="dialog__body">{ran ? result : intro}</p>
            <div className="dialog__actions">
                {ran ? null : (
                    <button type="button" className="btn btn--primary" onClick={() => setRan(true)}>
                        Run simulation
                    </button>
                )}
                <button type="button" className="btn btn--ghost btn--flat" onClick={onClose}>
                    {ran ? 'Close' : 'Cancel'}
                </button>
            </div>
        </Dialog>
    )
}
