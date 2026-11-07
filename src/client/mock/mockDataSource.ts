import type { Command, CommandOutcome } from '../shared/api/commands'
import { ApiError } from '../shared/api/dataSource'
import type { RoomRelayDataSource, SnapshotRequest } from '../shared/api/dataSource'
import type { Briefing, Shift, Snapshot, Staff } from '../shared/domain/types'
import { buildSimulatedBriefing } from '../features/handoff/briefing'
import { buildRoomViews } from '../features/rooms/roomViews'
import { scopeSnapshotForRole } from '../features/rooms/scope'
import { dispatchMockCommand, readMockState, recordMockBriefing } from './mockStore'

/**
 * PROTOTYPE data source. Reads nothing from ServiceNow and writes nothing anywhere: it works on
 * the in-memory demo store (mockStore.ts). Short artificial delays let loading states be seen.
 *
 * It is created for one signed-in demo account. A real data source would not be told who the
 * user is; the server knows that from the session.
 */
export class MockDataSource implements RoomRelayDataSource {
    private readonly actor: Staff
    private readonly latencyMs: number

    constructor(actor: Staff, latencyMs = 450) {
        this.actor = actor
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
                        // Same scoping the server applies: only what this role may see leaves the "server".
                        resolve(scopeSnapshotForRole(readMockState(), this.actor.role, this.actor))
                }
            }, this.latencyMs)

            signal?.addEventListener('abort', () => {
                clearTimeout(timer)
                reject(new DOMException('Aborted', 'AbortError'))
            })
        })
    }

    execute(command: Command): Promise<CommandOutcome> {
        return new Promise((resolve) => {
            setTimeout(() => resolve(dispatchMockCommand(command, this.actor)), Math.round(this.latencyMs / 2))
        })
    }

    /** The local preview has no AI: it always returns the labeled template, after a short delay. */
    generateBriefing(shift: Shift): Promise<Briefing> {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this.actor.role !== 'supervisor') {
                    reject(new ApiError('forbidden'))
                    return
                }
                const state = readMockState()
                const briefing = buildSimulatedBriefing(buildRoomViews(state), shift, state.generatedAt)
                recordMockBriefing(this.actor, shift)
                resolve(briefing)
            }, 1200)
        })
    }
}
