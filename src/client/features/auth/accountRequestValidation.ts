import type { Role, Shift } from '../../shared/domain/types.ts'
import { checkText } from '../../shared/lib/validation.ts'
import type { FieldErrors, ValidationResult } from '../../shared/lib/validation.ts'

/**
 * Account-request form rules.
 *
 * The server applies the same checks (through the command rules) before saving anything.
 */

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
