import React, { useState } from 'react'
import { useSession } from '../../features/auth/session'
import { resetMockStore } from '../../mock/mockStore'
import { useCommands } from '../../shared/api/DataContext'
import type { DemoScenario } from '../../shared/api/dataSource'
import { APP_MODE } from '../../shared/api/environment'
import { restoreInitialData } from '../../shared/api/serviceNowDataSource'
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
 * Data management in the sidebar.
 * Inside ServiceNow: administrator only. Restores the initial rooms, tasks, defects and audit
 * entries, for example before a new round of testing (the server checks the role again).
 * Local preview: also lets a developer preview the error screens.
 */
export function DataTools() {
    const { role, scenario, setScenario } = useSession()
    const { refresh } = useCommands()
    const [message, setMessage] = useState<string | null>(null)
    const [confirming, setConfirming] = useState(false)

    if (APP_MODE === 'servicenow' && role !== 'admin') return null

    const resetLocal = async () => {
        resetMockStore()
        await refresh()
        setMessage('Initial data restored.')
    }

    return (
        <details className="proto-tools">
            <summary>{APP_MODE === 'servicenow' ? 'Data management' : 'Preview tools'}</summary>
            {APP_MODE === 'demo' ? (
                <label>
                    <span>Preview a state</span>
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
                Restore initial data
            </button>
            <p className="proto-tools__hint" role="status">
                {message ?? 'Replaces all rooms, tasks, defects and audit entries with the initial data set.'}
            </p>
            {confirming ? (
                <ConfirmDialog
                    title="Restore initial data"
                    message="This deletes every RoomRelay room, task, defect and audit entry in this instance and restores the initial data set. Staff accounts are not changed. Continue?"
                    confirmLabel="Restore initial data"
                    onConfirm={async () => {
                        const failure = await restoreInitialData()
                        if (failure) return failure
                        await refresh()
                        setMessage('Initial data restored.')
                        return undefined
                    }}
                    onClose={() => setConfirming(false)}
                />
            ) : null}
        </details>
    )
}
