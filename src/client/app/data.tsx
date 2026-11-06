import React, { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { buildRoomViews } from '../domain/selectors'
import { scopeViewsForRole } from '../domain/scope'
import type { ApiErrorKind, RoomRelayDataSource } from '../services/dataSource'
import type { RoomView, Snapshot } from '../types/domain'
import { ErrorState, LoadingState } from '../components/ui/StateScreen'
import { useSession } from './session'
import { useSnapshot } from './useSnapshot'

export interface ReadyData {
    snapshot: Snapshot
    /** Every room. Only for lookups that must not leak existence; screens should use `scoped`. */
    allViews: RoomView[]
    /** Rooms the current role may see (demo-level scoping; the server must enforce the real rule). */
    scoped: { views: RoomView[]; note: string }
}

type DataState =
    | { status: 'loading' }
    | { status: 'error'; kind: ApiErrorKind; message: string }
    | { status: 'ready'; data: ReadyData }

interface DataValue {
    state: DataState
    reload: () => void
}

const DataContext = createContext<DataValue | null>(null)

/** Loads the snapshot once for the whole app, so screens share one consistent dataset. */
export function DataProvider({ source, children }: { source: RoomRelayDataSource; children: ReactNode }) {
    const { role, user, scenario } = useSession()
    const { state: raw, reload } = useSnapshot(source, scenario)

    const value = useMemo<DataValue>(() => {
        if (raw.status !== 'ready') return { state: raw, reload }
        const allViews = buildRoomViews(raw.data)
        const scoped = scopeViewsForRole(allViews, role, user)
        return { state: { status: 'ready', data: { snapshot: raw.data, allViews, scoped } }, reload }
    }, [raw, role, user, reload])

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

function useData(): DataValue {
    const ctx = useContext(DataContext)
    if (!ctx) throw new Error('DataGate must be used inside DataProvider')
    return ctx
}

/** Renders loading and error states, and the screen only once data is ready. */
export function DataGate({ loadingLabel = 'Loading', children }: { loadingLabel?: string; children: (data: ReadyData) => ReactNode }) {
    const { state, reload } = useData()
    const { signOut } = useSession()
    if (state.status === 'loading') return <LoadingState label={loadingLabel} />
    if (state.status === 'error') return <ErrorState
                kind={state.kind}
                message={state.message}
                onRetry={reload}
                onSignIn={() => signOut(state.message)}
            />
    return <>{children(state.data)}</>
}
