import type { Role, RoomView, Staff } from '../../shared/domain/types'
import { plural } from '../../shared/lib/format'

/**
 * Which readiness actions to PRESENT for a role and room, and why an action is unavailable.
 * The same checks are used by the command rules in roomCommands.ts, so the button and the rule
 * can never disagree. Unavailable actions are shown disabled WITH the reason, never as working buttons.
 *
 * PROTOTYPE NOTE: the server must re-check role, room ownership and every readiness rule.
 */

export type RoomActionId = 'submit_inspection' | 'pass_inspection' | 'fail_inspection'

export interface RoomAction {
    id: RoomActionId
    label: string
    enabled: boolean
    /** Why the action is unavailable (shown to the user). Present only when disabled. */
    reason?: string
    /** Plain-language description of what the action does. */
    description: string
    /** Destructive-looking actions are drawn as secondary buttons. */
    secondary?: boolean
}

/** Why a housekeeper cannot submit this room for inspection, or undefined when they can. */
export function submitBlockedReason(view: RoomView): string | undefined {
    const r = view.readiness
    const mandatoryOpen = r.mandatoryTotal - r.mandatoryDone
    if (r.isReady) return 'This room is already Ready.'
    if (mandatoryOpen > 0) return `${plural(mandatoryOpen, 'mandatory task')} must be completed before this room can be submitted for inspection.`
    if (r.openBlockingDefects > 0) return 'A blocking maintenance defect must be resolved before inspection.'
    if (view.room.inspection === 'pending') return 'An inspection has already been requested for this room.'
    return undefined
}

/** Why a supervisor cannot pass this room, or undefined when every readiness rule is met. */
export function passBlockedReason(view: RoomView): string | undefined {
    const r = view.readiness
    if (r.isReady) return 'This room is already Ready.'
    // The readiness sentence explains the most: show it whenever a rule is not met.
    if (r.mandatoryTotal - r.mandatoryDone > 0 || r.openBlockingDefects > 0) return r.summary
    if (view.room.inspection !== 'pending') return 'The housekeeper has not submitted this room for inspection yet.'
    return undefined
}

export function failBlockedReason(view: RoomView): string | undefined {
    if (view.room.inspection !== 'pending') return 'Only a room waiting for inspection can be failed.'
    return undefined
}

export function availableActions(view: RoomView, role: Role, user: Staff): RoomAction[] {
    if (view.readiness.isReady) return []

    if (role === 'housekeeping' && view.room.assigneeId === user.id) {
        const reason = submitBlockedReason(view)
        return [
            {
                id: 'submit_inspection',
                label: view.room.inspection === 'failed' ? 'Resubmit for inspection' : 'Submit for inspection',
                enabled: reason === undefined,
                reason,
                description: 'Ask a supervisor to inspect this room.',
            },
        ]
    }

    if (role === 'supervisor') {
        const passReason = passBlockedReason(view)
        const failReason = failBlockedReason(view)
        return [
            {
                id: 'pass_inspection',
                label: 'Pass inspection and confirm Ready',
                enabled: passReason === undefined,
                reason: passReason,
                description: 'Record a passed inspection. The room becomes Ready.',
            },
            {
                id: 'fail_inspection',
                label: 'Fail inspection',
                enabled: failReason === undefined,
                reason: failReason,
                description: 'The room stays Blocked until it is re-cleaned and resubmitted.',
                secondary: true,
            },
        ]
    }

    return []
}
