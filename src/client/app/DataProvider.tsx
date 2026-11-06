import React, { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useSession } from '../features/auth/session'
import { buildRoomViews } from '../features/rooms/roomViews'
import { scopeViewsForRole } from '../features/rooms/scope'
import type { Command, CommandOutcome } from '../shared/api/commands'
import { DataContext } from '../shared/api/DataContext'
import type { DataContextValue } from '../shared/api/DataContext'
import { ApiError } from '../shared/api/dataSource'
import type { RoomRelayDataSource } from '../shared/api/dataSource'
import { useSnapshot } from '../shared/api/useSnapshot'

/**
 * Loads the operations data (rooms with their tasks and defects, plus the audit log) once for the
 * whole app, computes readiness, narrows it to the signed-in role, and lets screens send changes.
 * Screens read it through DataGate and useCommands (shared/api/DataContext.tsx).
 */
export function DataProvider({ source, children }: { source: RoomRelayDataSource; children: ReactNode }) {
    const { role, user, scenario, signOut } = useSession()
    const { state: raw, reload, refresh } = useSnapshot(source, scenario)

    const run = useCallback(
        async (command: Command): Promise<CommandOutcome> => {
            try {
                const outcome = await source.execute(command)
                if (outcome.ok) await refresh()
                return outcome
            } catch (err: unknown) {
                const message = err instanceof ApiError ? err.message : new ApiError('server').message
                return { ok: false, kind: 'conflict', message }
            }
        },
        [source, refresh]
    )

    const value = useMemo<DataContextValue>(() => {
        const base = { reload, run, refresh, signOut }
        if (raw.status !== 'ready') return { ...base, state: raw }
        const allViews = buildRoomViews(raw.data)
        const scoped = scopeViewsForRole(allViews, role, user)
        return { ...base, state: { status: 'ready', data: { snapshot: raw.data, allViews, scoped } } }
    }, [raw, role, user, reload, run, refresh, signOut])

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
