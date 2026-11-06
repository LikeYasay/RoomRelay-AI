import React, { createContext, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STAFF } from '../data/mockData'
import type { DemoScenario } from '../services/dataSource'
import type { Role, Staff } from '../types/domain'

/**
 * PROTOTYPE session. A real session comes from ServiceNow (the logged-in user and
 * their roles are decided on the server). The role chosen here only changes what
 * the demo UI shows. It grants no access to anything.
 */

const DEMO_USER_ID: Record<Role, string> = {
    housekeeping: 'h1',
    maintenance: 'm1',
    supervisor: 's1',
    admin: 'a1',
}

interface SessionValue {
    role: Role
    user: Staff
    scenario: DemoScenario
    setRole: (role: Role) => void
    setScenario: (scenario: DemoScenario) => void
}

const SessionContext = createContext<SessionValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<Role>('supervisor')
    const [scenario, setScenario] = useState<DemoScenario>('normal')

    const value = useMemo<SessionValue>(() => {
        const user = STAFF.find((s) => s.id === DEMO_USER_ID[role]) as Staff
        return { role, user, scenario, setRole, setScenario }
    }, [role, scenario])

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession(): SessionValue {
    const ctx = useContext(SessionContext)
    if (!ctx) throw new Error('useSession must be used inside SessionProvider')
    return ctx
}
