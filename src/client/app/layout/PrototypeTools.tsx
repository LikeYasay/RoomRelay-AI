import React, { useState } from 'react'
import { useSession } from '../../features/auth/session'
import { resetMockStore } from '../../mock/mockStore'
import { useCommands } from '../../shared/api/DataContext'
import type { DemoScenario } from '../../shared/api/dataSource'
import { APP_MODE } from '../../shared/api/environment'
import { resetServerDemoData } from '../../shared/api/serviceNowDataSource'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'

const SCENARIOS: Array<{ value: DemoScenario; label: string }> = [
    { value: 'normal', label: 'Normal' },
    { value: 'unauthenticated', label: 'Not signed in' },
    { value: 'expired', label: 'Session expired' },
    { value: 'forbidden', label: 'Insufficient permissions' },
    { value: 'server_error', label: 'Server error' },
]

function isScenario(value: string): value is DemoScenario {
    return SCENARIOS.some((s) => s.value === value)
}

/**
 * Demo helpers. Local preview: preview error states and reset the in-memory data.
 * Inside ServiceNow: only the RoomRelay administrator sees this, and can reload the demo dataset
 * (the server checks the role again).
 */
export function PrototypeTools() {
    const { role, scenario, setScenario } = useSession()
    const { refresh } = useCommands()
    const [message, setMessage] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    if (APP_MODE === 'servicenow' && role !== 'admin') return null

    const resetLocal = async () => {
        resetMockStore()
        await refresh()
        setMessage('Demo data restored to the original.')
    }

    return (
        <details className="proto-tools">
            <summary>{APP_MODE === 'servicenow' ? 'Demo tools' : 'Prototype tools'}</summary>
            {APP_MODE === 'demo' ? (
                <label>
                    <span>Simulate a problem</span>
                    <select value={scenario} onChange={(e) => isScenario(e.target.value) && setScenario(e.target.value)}>
                        {SCENARIOS.map((s) => (
                            <option key={s.value} value={s.value}>
                                {s.label}
                            </option>
                        ))}
                    </select>
                </label>
            ) : null}
            <button type="button" className="proto-tools__reset" onClick={APP_MODE === 'demo' ? resetLocal : () => setConfirming(true)}>
                {APP_MODE === 'demo' ? 'Reset demo data' : 'Load demo data'}
            </button>
            <p className="proto-tools__hint" role="status">
                {message ??
                    (APP_MODE === 'demo'
                        ? 'Changes are kept in this tab until you reload or reset.'
                        : 'Replaces all RoomRelay rooms, tasks, defects and audit entries in ServiceNow.')}
            </p>
            {confirming ? (
                <ConfirmDialog
                    title="Load demo data"
                    message="This deletes every RoomRelay room, task, defect and audit entry in this ServiceNow instance and loads the demo dataset again. Continue?"
                    confirmLabel="Load demo data"
                    onConfirm={async () => {
                        const failure = await resetServerDemoData()
                        if (failure) return failure
                        await refresh()
                        setMessage('Demo data loaded.')
                        return undefined
                    }}
                    onClose={() => setConfirming(false)}
                />
            ) : null}
        </details>
    )
}
