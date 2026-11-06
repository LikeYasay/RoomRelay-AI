import { buildMockSnapshot } from '../data/mockData'
import type { Snapshot } from '../types/domain'
import { ApiError } from './dataSource'
import type { RoomRelayDataSource, SnapshotRequest } from './dataSource'

/**
 * PROTOTYPE data source. Reads nothing from ServiceNow and writes nothing anywhere.
 * A short artificial delay lets the loading state be seen.
 */
export class MockDataSource implements RoomRelayDataSource {
    private readonly latencyMs: number

    constructor(latencyMs = 450) {
        this.latencyMs = latencyMs
    }

    getSnapshot(request: SnapshotRequest = {}): Promise<Snapshot> {
        const { signal, demoScenario = 'normal' } = request

        return new Promise<Snapshot>((resolve, reject) => {
            if (signal?.aborted) {
                reject(new DOMException('Aborted', 'AbortError'))
                return
            }

            const timer = setTimeout(() => {
                switch (demoScenario) {
                    case 'unauthenticated':
                        reject(new ApiError('unauthenticated'))
                        return
                    case 'expired':
                        reject(new ApiError('expired'))
                        return
                    case 'forbidden':
                        reject(new ApiError('forbidden'))
                        return
                    case 'server_error':
                        reject(new ApiError('server'))
                        return
                    default:
                        resolve(buildMockSnapshot())
                }
            }, this.latencyMs)

            signal?.addEventListener('abort', () => {
                clearTimeout(timer)
                reject(new DOMException('Aborted', 'AbortError'))
            })
        })
    }
}
