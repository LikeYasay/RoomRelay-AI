import type { Role, Severity, Shift } from '../types/domain'

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

export const ACCOUNT_LIMITS = {
    nameMin: 2,
    nameMax: 80,
    emailMax: 120,
    reasonMin: 10,
    reasonMax: 300,
} as const

/** Roles a person may ASK for. Administrator accounts are created by IT only, never self-requested. */
export const REQUESTABLE_ROLES: Role[] = ['housekeeping', 'maintenance', 'supervisor']
export const SHIFTS: Shift[] = ['morning', 'afternoon', 'night']

export interface AccountRequestInput {
    fullName: string
    email: string
    role: string
    shift: string
    reason: string
}

export interface AccountRequestValue {
    fullName: string
    email: string
    role: Role
    shift: Shift
    reason: string
}

type AccountField = 'fullName' | 'email' | 'role' | 'shift' | 'reason'

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}\s'.-]*$/u
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[A-Za-z]{2,}$/

/**
 * Account-request form checks. The form never collects a password: people sign in
 * through ServiceNow, and an administrator approves the request and grants the roles.
 * The requester can ask for a role but can never grant themselves one.
 */
export function validateAccountRequest(input: AccountRequestInput): ValidationResult<AccountRequestValue, AccountField> {
    const errors: FieldErrors<AccountField> = {}

    const nameError = checkText('Full name', input.fullName, ACCOUNT_LIMITS.nameMin, ACCOUNT_LIMITS.nameMax, true)
    if (nameError) errors.fullName = nameError
    else if (!NAME_PATTERN.test(input.fullName.trim())) errors.fullName = 'Full name can only contain letters, spaces, apostrophes, hyphens and periods.'

    const email = input.email.trim()
    if (email === '') errors.email = 'Work email is required.'
    else if (email.length > ACCOUNT_LIMITS.emailMax) errors.email = `Work email must be ${ACCOUNT_LIMITS.emailMax} characters or fewer.`
    else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid work email address, for example name@hotel.com.'

    const role = REQUESTABLE_ROLES.find((r) => r === input.role)
    if (input.role === 'admin') errors.role = 'Administrator accounts cannot be requested here. Contact IT.'
    else if (!role) errors.role = 'Choose the role you need.'

    const shift = SHIFTS.find((s) => s === input.shift)
    if (!shift) errors.shift = 'Choose your usual shift.'

    const reasonError = checkText('Reason for access', input.reason, ACCOUNT_LIMITS.reasonMin, ACCOUNT_LIMITS.reasonMax, false)
    if (reasonError) errors.reason = reasonError

    if (Object.keys(errors).length > 0 || !role || !shift) return { ok: false, errors }

    return {
        ok: true,
        errors: {},
        value: { fullName: input.fullName.trim(), email, role, shift, reason: input.reason.trim() },
    }
}

export function validateResolution(notes: string): ValidationResult<{ notes: string }, 'notes'> {
    const error = checkText('A resolution note', notes, LIMITS.resolutionMin, LIMITS.resolutionMax, false)
    if (error) return { ok: false, errors: { notes: error } }
    return { ok: true, errors: {}, value: { notes: notes.trim() } }
}
