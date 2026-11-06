/**
 * Shared building blocks for form validation. Each feature keeps its own form rules
 * (for example features/maintenance/defectValidation.ts) and uses these helpers.
 *
 * PROTOTYPE NOTE: this improves usability and rejects obviously bad input early.
 * It is NOT a security boundary. Anyone can bypass the browser, so the server
 * must repeat every one of these checks (and more) before saving anything.
 */

// Control characters other than tab and line breaks (never legitimate in these fields).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/

export type FieldErrors<T extends string> = Partial<Record<T, string>>

export type ValidationResult<V, K extends string> =
    | { ok: true; value: V; errors: Record<string, never> }
    | { ok: false; errors: FieldErrors<K> }

/** Checks a required text field. Returns an error message, or undefined when the text is acceptable. */
export function checkText(label: string, raw: string, min: number, max: number, singleLine: boolean): string | undefined {
    const text = raw.trim()
    if (text.length === 0) return `${label} is required.`
    if (text.length < min) return `${label} must be at least ${min} characters.`
    if (text.length > max) return `${label} must be ${max} characters or fewer.`
    if (CONTROL_CHARS.test(text)) return `${label} contains unsupported characters.`
    if (singleLine && /[\r\n]/.test(text)) return `${label} must be on a single line.`
    return undefined
}
