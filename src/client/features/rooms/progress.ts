import type { RoomView } from '../../shared/domain/types'

export type CleaningState = 'not_started' | 'in_progress' | 'complete'

export interface CleaningProgress {
    state: CleaningState
    done: number
    total: number
}

export const CLEANING_LABEL: Record<CleaningState, string> = {
    not_started: 'Not started',
    in_progress: 'In progress',
    complete: 'Cleaned',
}

/**
 * Cleaning progress is NOT readiness. A room can be fully cleaned and still be
 * Blocked (failed inspection, open Blocking defect) or Pending Inspection.
 */
export function cleaningProgress(view: RoomView): CleaningProgress {
    const mandatory = view.tasks.filter((t) => t.mandatory)
    const done = mandatory.filter((t) => t.status === 'completed').length
    const started = mandatory.some((t) => t.status !== 'pending')
    const state: CleaningState = mandatory.length > 0 && done === mandatory.length ? 'complete' : started ? 'in_progress' : 'not_started'
    return { state, done, total: mandatory.length }
}
