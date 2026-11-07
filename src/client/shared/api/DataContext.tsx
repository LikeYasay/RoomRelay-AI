import React, { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import type { Briefing, RoomView, Shift, Snapshot } from '../domain/types'
import { ErrorState, LoadingState } from '../ui/StateScreen'
import type { Command, CommandOutcome } from './commands'
import type { ApiErrorKind } from './dataSource'

/**
 * What every screen can read and do with the operations data. Screens only depend on this
 * contract; app/DataProvider.tsx provides it (loading, readiness, role scoping, sending changes).
 */

export interface ReadyData {
    snapshot: Snapshot
    /** Every room. Only for lookups that must not leak existence; screens should use `scoped`. */
    allViews: RoomView[]
    /** Rooms the current role may see (the server already sent only these; this narrows the views). */
    scoped: { views: RoomView[]; note: string }
}

export type DataState =
    | { status: 'loading' }
    | { status: 'error'; kind: ApiErrorKind; message: string }
    | { status: 'ready'; data: ReadyData }

export interface DataContextValue {
    state: DataState
    /** Shows the loading screen and loads again ("Try again"). */
    reload: () => void
    /** Sends one change to the data source, then quietly refreshes the data. Never throws. */
    run: (command: Command) => Promise<CommandOutcome>
    /** Re-reads the data without showing the loading screen. */
    refresh: () => Promise<void>
    /** Generates the shift briefing (AI inside ServiceNow, template in the local preview). Rejects with ApiError. */
    generateBriefing: (shift: Shift) => Promise<Briefing>
    /** Sends the user back to sign-in, with a message (expired session, for example). */
    signOut: (notice?: string) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

function useData(): DataContextValue {
    const ctx = useContext(DataContext)
    if (!ctx) throw new Error('DataGate and useCommands must be used inside DataProvider')
    return ctx
}

/** For screens and dialogs that change data. */
export function useCommands(): Pick<DataContextValue, 'run' | 'refresh' | 'generateBriefing'> {
    const { run, refresh, generateBriefing } = useData()
    return { run, refresh, generateBriefing }
}

/** Renders loading and error states, and the screen only once data is ready. */
export function DataGate({ loadingLabel = 'Loading', children }: { loadingLabel?: string; children: (data: ReadyData) => ReactNode }) {
    const { state, reload, signOut } = useData()
    if (state.status === 'loading') return <LoadingState label={loadingLabel} />
    if (state.status === 'error')
        return <ErrorState kind={state.kind} message={state.message} onRetry={reload} onSignIn={() => signOut(state.message)} />
    return <>{children(state.data)}</>
}
