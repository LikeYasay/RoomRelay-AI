import type { Role, RoomView, Staff } from '../types/domain'
import { plural } from './format'

/**
 * Which readiness-related actions to PRESENT for a role and room.
 *
 * PROTOTYPE NOTE: these only decide what the UI shows. Phase 1 and 2 actions are
 * simulations that change nothing. In Phase 4 the server must re-check role, room
 * ownership and every readiness rule before any status change, whatever the UI shows.
 * Unavailable actions are shown disabled WITH the reason, never as working buttons.
 */

export type RoomActionId = 'submit_inspection' | 'confirm_ready'

export interface RoomAction {
    id: RoomActionId
    label: string
    enabled: boolean
    /** Why the action is unavailable (shown to the user). Present only when disabled. */
    reason?: string
    /** Plain-language description of what the real action will do. */
    description: string
}

export function availableActions(view: RoomView, role: Role, user: Staff): RoomAction[] {
    const r = view.readiness
    if (r.isReady) return []

    const mandatoryOpen = r.mandatoryTotal - r.mandatoryDone

    if (role === 'housekeeping' && view.room.assigneeId === user.id) {
        let reason: string | undefined
        if (mandatoryOpen > 0) {
            reason = `${plural(mandatoryOpen, 'mandatory task')} must be completed before this room can be submitted for inspection.`
        } else if (r.openBlockingDefects > 0) {
            reason = 'A blocking maintenance defect must be resolved before inspection.'
        } else if (view.room.inspection === 'pending') {
            reason = 'An inspection has already been requested for this room.'
        }
        return [
            {
                id: 'submit_inspection',
                label: 'Submit for inspection',
                enabled: reason === undefined,
                reason,
                description: 'Ask a supervisor to inspect this room.',
            },
        ]
    }

    if (role === 'supervisor') {
        const eligible = mandatoryOpen === 0 && r.openBlockingDefects === 0 && view.room.inspection === 'pending'
        return [
            {
                id: 'confirm_ready',
                label: 'Pass inspection and confirm Ready',
                enabled: eligible,
                reason: eligible ? undefined : r.summary,
                description: 'Record a passed inspection and mark this room Ready.',
            },
        ]
    }

    return []
}
