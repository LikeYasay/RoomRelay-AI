import React, { useState } from 'react'
import { useSession } from '../../features/auth/session'
import { resetMockStore } from '../../mock/mockStore'
import { useCommands } from '../../shared/api/DataContext'
import type { DemoScenario } from '../../shared/api/dataSource'

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
 * Prototype-only: previews error and access states, and resets the live demo data.
 * It changes what the demo shows and nothing else.
 */
export function PrototypeTools() {
    const { scenario, setScenario } = useSession()
    const { refresh } = useCommands()
    const [resetDone, setResetDone] = useState(false)

    const reset = async () => {
        resetMockStore()
        await refresh()
        setResetDone(true)
    }

    return (
        <details className="proto-tools">
            <summary>Prototype tools</summary>
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
            <button type="button" className="proto-tools__reset" onClick={reset}>
                Reset demo data
            </button>
            <p className="proto-tools__hint" role="status">
                {resetDone ? 'Demo data restored to the original.' : 'Changes are kept in this tab until you reload or reset.'}
            </p>
        </details>
    )
}
