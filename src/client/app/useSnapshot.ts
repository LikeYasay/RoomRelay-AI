import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '../services/dataSource'
import type { ApiErrorKind, DemoScenario, RoomRelayDataSource } from '../services/dataSource'
import type { Snapshot } from '../types/domain'

export type SnapshotState =
    | { status: 'loading' }
    | { status: 'ready'; data: Snapshot }
    | { status: 'error'; kind: ApiErrorKind; message: string }

/**
 * Loads data through the data-source boundary and converts every failure into a
 * safe, user-facing state. Raw error objects never reach the UI.
 */
export function useSnapshot(source: RoomRelayDataSource, scenario: DemoScenario): { state: SnapshotState; reload: () => void } {
    const [state, setState] = useState<SnapshotState>({ status: 'loading' })
    const [attempt, setAttempt] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        setState({ status: 'loading' })

        source
            .getSnapshot({ signal: controller.signal, demoScenario: scenario })
            .then((data) => {
                if (!controller.signal.aborted) setState({ status: 'ready', data })
            })
            .catch((err: unknown) => {
                if (controller.signal.aborted) return
                if (err instanceof ApiError) {
                    setState({ status: 'error', kind: err.kind, message: err.message })
                } else {
                    setState({ status: 'error', kind: 'server', message: new ApiError('server').message })
                }
            })

        return () => controller.abort()
    }, [source, scenario, attempt])

    const reload = useCallback(() => setAttempt((n) => n + 1), [])
    return { state, reload }
}
