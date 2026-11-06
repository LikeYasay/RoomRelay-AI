import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { STAFF } from '../../mock/mockData'
import type { DemoScenario } from '../../shared/api/dataSource'
import type { Role, Staff } from '../../shared/domain/types'

/**
 * PROTOTYPE session.
 *
 * In the live app, ServiceNow signs people in and out (its own login page and session
 * cookie) and the SERVER decides which roles a user has. This client never sees or
 * stores a password. Here, "signing in" just picks one of the synthetic demo accounts so
 * the screens can be shown for each role. It grants no access to anything real.
 *
 * Only the demo account id is kept in sessionStorage (cleared on sign-out or when the
 * tab closes) so a page refresh does not log the demo user out. It is checked against
 * the known demo accounts on every read.
 */

const STORAGE_KEY = 'roomrelay.demoAccount'

function loadAccount(): Staff | null {
    try {
        const id = window.sessionStorage.getItem(STORAGE_KEY)
        return STAFF.find((s) => s.id === id) ?? null
    } catch {
        return null
    }
}

function storeAccount(id: string | null): void {
    try {
        if (id === null) window.sessionStorage.removeItem(STORAGE_KEY)
        else window.sessionStorage.setItem(STORAGE_KEY, id)
    } catch {
        // Storage can be blocked; the demo still works for this page view.
    }
}

interface AuthValue {
    account: Staff | null
    scenario: DemoScenario
    /** Message shown on the sign-in page (for example after a session expires). */
    notice: string | null
    setScenario: (scenario: DemoScenario) => void
    signIn: (accountId: string) => boolean
    signOut: (notice?: string) => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<Staff | null>(loadAccount)
    const [scenario, setScenario] = useState<DemoScenario>('normal')
    const [notice, setNotice] = useState<string | null>(null)

    const signIn = useCallback((accountId: string): boolean => {
        const found = STAFF.find((s) => s.id === accountId)
        if (!found) return false
        storeAccount(found.id)
        setNotice(null)
        setScenario('normal')
        setAccount(found)
        window.location.hash = '#/dashboard'
        return true
    }, [])

    const signOut = useCallback((message?: string) => {
        storeAccount(null)
        setScenario('normal')
        setNotice(message ?? null)
        setAccount(null)
        window.location.hash = '#/login'
    }, [])

    const value = useMemo<AuthValue>(
        () => ({ account, scenario, notice, setScenario, signIn, signOut }),
        [account, scenario, notice, signIn, signOut]
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/** For screens that may be shown while signed out (sign-in and create-account). */
export function useAuth(): AuthValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside SessionProvider')
    return ctx
}

interface SessionValue {
    role: Role
    user: Staff
    scenario: DemoScenario
    setScenario: (scenario: DemoScenario) => void
    signOut: (notice?: string) => void
}

/** For screens that only render when someone is signed in. */
export function useSession(): SessionValue {
    const { account, scenario, setScenario, signOut } = useAuth()
    if (!account) throw new Error('useSession requires a signed-in account')
    return useMemo(
        () => ({ role: account.role, user: account, scenario, setScenario, signOut }),
        [account, scenario, setScenario, signOut]
    )
}
