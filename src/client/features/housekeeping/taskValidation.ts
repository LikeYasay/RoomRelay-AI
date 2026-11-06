import { INCOMPLETE_REASONS } from '../../shared/domain/labels'
import type { IncompleteReason } from '../../shared/domain/types'
import { checkText } from '../../shared/lib/validation'
import type { ValidationResult } from '../../shared/lib/validation'

/**
 * "Couldn't Complete" form rules: a reason is required, and a note is required when the reason is "Other".
 *
 * PROTOTYPE NOTE: usability only. The server must repeat every check before saving.
 */

export const NOTE_LIMITS = { min: 3, max: 300 } as const

export interface IncompleteValue {
    reason: IncompleteReason
    note: string | undefined
}

export function isIncompleteReason(value: string): value is IncompleteReason {
    return (INCOMPLETE_REASONS as string[]).includes(value)
}

export function validateIncomplete(input: { reason: string; note: string }): ValidationResult<IncompleteValue, 'reason' | 'note'> {
    const errors: { reason?: string; note?: string } = {}
    const reason = isIncompleteReason(input.reason) ? input.reason : undefined
    if (!reason) errors.reason = 'Choose why the task could not be completed.'

    const note = input.note.trim()
    if (reason === 'other' || note !== '') {
        const noteError = checkText('A note', input.note, NOTE_LIMITS.min, NOTE_LIMITS.max, false)
        if (noteError) errors.note = reason === 'other' && note === '' ? 'Add a short note explaining the reason.' : noteError
    }

    if (Object.keys(errors).length > 0 || !reason) return { ok: false, errors }
    return { ok: true, errors: {}, value: { reason, note: note === '' ? undefined : note } }
}
