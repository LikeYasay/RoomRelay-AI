import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from './dataSource'
import type { ApiErrorKind, DemoScenario, RoomRelayDataSource } from './dataSource'
import type { Snapshot } from '../domain/types'

export type SnapshotState =
    | { status: 'loading' }
    | { status: 'ready'; data: Snapshot }
    | { status: 'error'; kind: ApiErrorKind; message: string }

function toErrorState(err: unknown): SnapshotState {
    if (err instanceof ApiError) return { status: 'error', kind: err.kind, message: err.message }
    return { status: 'error', kind: 'server', message: new ApiError('server').message }
}

/**
 * Loads data through the data-source boundary and converts every failure into a
 * safe, user-facing state. Raw error objects never reach the UI.
 *
 * `reload` shows the loading screen again (used by "Try again").
 * `refresh` fetches quietly after a change, keeping the current screen and any open dialog.
 */
export function useSnapshot(
    source: RoomRelayDataSource,
    scenario: DemoScenario
): { state: SnapshotState; reload: () => void; refresh: () => Promise<void> } {
    const [state, setState] = useState<SnapshotState>({ status: 'loading' })
    const [attempt, setAttempt] = useState(0)
    const mounted = useRef(true)

    useEffect(() => {
        mounted.current = true
        return () => {
            mounted.current = false
        }
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        setState({ status: 'loading' })

        source
            .getSnapshot({ signal: controller.signal, demoScenario: scenario })
            .then((data) => {
                if (!controller.signal.aborted) setState({ status: 'ready', data })
            })
            .catch((err: unknown) => {
                if (!controller.signal.aborted) setState(toErrorState(err))
            })

        return () => controller.abort()
    }, [source, scenario, attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])

    const refresh = useCallback(async () => {
        try {
            const data = await source.getSnapshot({ demoScenario: scenario })
            if (mounted.current) setState({ status: 'ready', data })
        } catch (err: unknown) {
            if (mounted.current) setState(toErrorState(err))
        }
    }, [source, scenario])

    return { state, reload, refresh }
}
