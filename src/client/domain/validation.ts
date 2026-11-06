import type { Severity } from '../types/domain'

/**
 * Input validation for forms.
 *
 * PROTOTYPE NOTE: this improves usability and rejects obviously bad input early.
 * It is NOT a security boundary. Anyone can bypass the browser, so the ServiceNow
 * server must repeat every one of these checks (and more) before saving anything.
 */

export const LIMITS = {
    defectTitleMin: 3,
    defectTitleMax: 100,
    defectDescriptionMin: 10,
    defectDescriptionMax: 1000,
    resolutionMin: 5,
    resolutionMax: 500,
} as const

export const SEVERITIES: Severity[] = ['low', 'medium', 'high', 'critical']

// Control characters other than tab and line breaks (never legitimate in these fields).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export interface DefectReportInput {
    roomId: string
    title: string
    description: string
    severity: string
    blocking: boolean
}

export interface DefectReportValue {
    roomId: string
    title: string
    description: string
    severity: Severity
    blocking: boolean
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export type ValidationResult<V, K extends string> =
    | { ok: true; value: V; errors: Record<string, never> }
    | { ok: false; errors: FieldErrors<K> }

function isSeverity(value: string): value is Severity {
    return (SEVERITIES as string[]).includes(value)
}

function checkText(label: string, raw: string, min: number, max: number, singleLine: boolean): string | undefined {
    const text = raw.trim()
    if (text.length === 0) return `${label} is required.`
    if (text.length < min) return `${label} must be at least ${min} characters.`
    if (text.length > max) return `${label} must be ${max} characters or fewer.`
    if (CONTROL_CHARS.test(text)) return `${label} contains unsupported characters.`
    if (singleLine && /[\r\n]/.test(text)) return `${label} must be on a single line.`
    return undefined
}

/** `allowedRoomIds` is the list of rooms this user may report against (resource-identifier check). */
export function validateDefectReport(
    input: DefectReportInput,
    allowedRoomIds: string[]
): ValidationResult<DefectReportValue, 'roomId' | 'title' | 'description' | 'severity'> {
    const errors: FieldErrors<'roomId' | 'title' | 'description' | 'severity'> = {}

    if (input.roomId === '') errors.roomId = 'Choose a room.'
    else if (!allowedRoomIds.includes(input.roomId)) errors.roomId = 'Choose a room from the list.'

    const titleError = checkText('Problem title', input.title, LIMITS.defectTitleMin, LIMITS.defectTitleMax, true)
    if (titleError) errors.title = titleError

    const descError = checkText('Description', input.description, LIMITS.defectDescriptionMin, LIMITS.defectDescriptionMax, false)
    if (descError) errors.description = descError

    if (!isSeverity(input.severity)) errors.severity = 'Choose a severity.'

    if (Object.keys(errors).length > 0 || !isSeverity(input.severity)) return { ok: false, errors }

    return {
        ok: true,
        errors: {},
        value: {
            roomId: input.roomId,
            title: input.title.trim(),
            description: input.description.trim(),
            severity: input.severity,
            blocking: input.blocking,
        },
    }
}

export function validateResolution(notes: string): ValidationResult<{ notes: string }, 'notes'> {
    const error = checkText('A resolution note', notes, LIMITS.resolutionMin, LIMITS.resolutionMax, false)
    if (error) return { ok: false, errors: { notes: error } }
    return { ok: true, errors: {}, value: { notes: notes.trim() } }
}
