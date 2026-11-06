import React from 'react'
import { useSession } from '../../app/session'
import { ROLE_LABEL } from '../../domain/labels'
import type { DemoScenario } from '../../services/dataSource'
import type { Role } from '../../types/domain'

const ROLES: Role[] = ['housekeeping', 'maintenance', 'supervisor', 'admin']

const SCENARIOS: Array<{ value: DemoScenario; label: string }> = [
    { value: 'normal', label: 'Signed in (normal)' },
    { value: 'unauthenticated', label: 'Not signed in' },
    { value: 'expired', label: 'Session expired' },
    { value: 'forbidden', label: 'Insufficient permissions' },
    { value: 'server_error', label: 'Server error' },
]

function isRole(value: string): value is Role {
    return (ROLES as string[]).includes(value)
}

function isScenario(value: string): value is DemoScenario {
    return SCENARIOS.some((s) => s.value === value)
}

/**
 * Prototype-only controls to preview role-aware screens and error states.
 * They change what this demo displays. They do not authenticate anyone.
 */
export function DemoControls() {
    const { role, scenario, setRole, setScenario } = useSession()

    return (
        <fieldset className="demo-controls">
            <legend>Demo controls (prototype)</legend>
            <label>
                <span>Preview as</span>
                <select value={role} onChange={(e) => isRole(e.target.value) && setRole(e.target.value)}>
                    {ROLES.map((r) => (
                        <option key={r} value={r}>
                            {ROLE_LABEL[r]}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <span>Simulate</span>
                <select value={scenario} onChange={(e) => isScenario(e.target.value) && setScenario(e.target.value)}>
                    {SCENARIOS.map((s) => (
                        <option key={s.value} value={s.value}>
                            {s.label}
                        </option>
                    ))}
                </select>
            </label>
        </fieldset>
    )
}
