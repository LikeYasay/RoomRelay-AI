import React from 'react'
import type { ReactNode } from 'react'

/**
 * Accessible form controls: every control has a visible label, required fields are
 * marked in text, errors are linked with aria-describedby and aria-invalid, and
 * character limits are enforced with maxLength plus a visible counter.
 */

interface ShellProps {
    id: string
    label: string
    required?: boolean
    hint?: string
    error?: string
    children: ReactNode
}

function FieldShell({ id, label, required, hint, error, children }: ShellProps) {
    return (
        <div className={`form-field${error ? ' form-field--error' : ''}`}>
            <label htmlFor={id}>
                {label}
                {required ? <span className="form-field__required"> (required)</span> : null}
            </label>
            {hint ? (
                <p id={`${id}-hint`} className="form-field__hint">
                    {hint}
                </p>
            ) : null}
            {children}
            {error ? (
                <p id={`${id}-error`} className="form-field__error">
                    {error}
                </p>
            ) : null}
        </div>
    )
}

function describedBy(id: string, hint?: string, error?: string): string | undefined {
    const ids = [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean)
    return ids.length > 0 ? ids.join(' ') : undefined
}

interface CommonProps {
    id: string
    label: string
    required?: boolean
    hint?: string
    error?: string
}

export function TextInput({
    id,
    label,
    required,
    hint,
    error,
    value,
    maxLength,
    onChange,
}: CommonProps & { value: string; maxLength: number; onChange: (v: string) => void }) {
    return (
        <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
            <input
                id={id}
                type="text"
                value={value}
                maxLength={maxLength}
                autoComplete="off"
                aria-required={required}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, hint, error)}
                onChange={(e) => onChange(e.target.value)}
            />
            <p className="form-field__count" aria-hidden="true">
                {value.length}/{maxLength}
            </p>
        </FieldShell>
    )
}

export function TextArea({
    id,
    label,
    required,
    hint,
    error,
    value,
    maxLength,
    rows = 4,
    onChange,
}: CommonProps & { value: string; maxLength: number; rows?: number; onChange: (v: string) => void }) {
    return (
        <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
            <textarea
                id={id}
                value={value}
                rows={rows}
                maxLength={maxLength}
                aria-required={required}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, hint, error)}
                onChange={(e) => onChange(e.target.value)}
            />
            <p className="form-field__count" aria-hidden="true">
                {value.length}/{maxLength}
            </p>
        </FieldShell>
    )
}

export function SelectInput({
    id,
    label,
    required,
    hint,
    error,
    value,
    options,
    placeholder,
    onChange,
}: CommonProps & {
    value: string
    options: Array<{ value: string; label: string }>
    placeholder?: string
    onChange: (v: string) => void
}) {
    return (
        <FieldShell id={id} label={label} required={required} hint={hint} error={error}>
            <select
                id={id}
                value={value}
                aria-required={required}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedBy(id, hint, error)}
                onChange={(e) => onChange(e.target.value)}
            >
                {placeholder ? <option value="">{placeholder}</option> : null}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </FieldShell>
    )
}

/** Lists every error at the top of the form, each linking to its field. */
export function ErrorSummary({ errors, fieldIds }: { errors: Record<string, string | undefined>; fieldIds: Record<string, string> }) {
    const entries = Object.entries(errors).filter((e): e is [string, string] => Boolean(e[1]))
    if (entries.length === 0) return null
    return (
        <div className="error-summary" role="alert" tabIndex={-1}>
            <p>
                <strong>Please fix {entries.length === 1 ? '1 problem' : `${entries.length} problems`}:</strong>
            </p>
            <ul>
                {entries.map(([key, message]) => (
                    <li key={key}>
                        {/* A button, not a "#id" link: a hash link would change the app's route. */}
                        <button
                            type="button"
                            className="linklike"
                            onClick={() => document.getElementById(fieldIds[key] ?? '')?.focus()}
                        >
                            {message}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    )
}
