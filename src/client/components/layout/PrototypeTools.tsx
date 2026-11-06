import React from 'react'
import { useSession } from '../../app/session'
import type { DemoScenario } from '../../services/dataSource'

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

/** Prototype-only: previews error and access states. It changes what the demo shows and nothing else. */
export function PrototypeTools() {
    const { scenario, setScenario } = useSession()

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
        </details>
    )
}
