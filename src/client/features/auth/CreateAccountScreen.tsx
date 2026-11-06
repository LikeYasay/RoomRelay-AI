import React, { useState } from 'react'
import { ROLE_LABEL, SHIFT_LABEL } from '../../shared/domain/labels'
import { ACCOUNT_LIMITS, REQUESTABLE_ROLES, SHIFTS, validateAccountRequest } from './accountRequestValidation'
import type { AccountRequestValue } from './accountRequestValidation'
import { Banner } from '../../shared/ui/Banner'
import { ErrorSummary, SelectInput, TextArea, TextInput } from '../../shared/ui/FormFields'
import { AuthLayout } from './AuthLayout'

const FIELD_IDS = {
    fullName: 'req-name',
    email: 'req-email',
    role: 'req-role',
    shift: 'req-shift',
    reason: 'req-reason',
}

/**
 * PROTOTYPE account request. It collects NO password: in the live system a System
 * Administrator approves the request, creates the ServiceNow user and grants the role.
 * Nothing is saved here.
 */
export function CreateAccountScreen() {
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [role, setRole] = useState('')
    const [shift, setShift] = useState('')
    const [reason, setReason] = useState('')
    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [accepted, setAccepted] = useState<AccountRequestValue | null>(null)

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        const result = validateAccountRequest({ fullName, email, role, shift, reason })
        if (!result.ok) {
            setErrors(result.errors)
            return
        }
        setErrors({})
        setAccepted(result.value)
    }

    return (
        <AuthLayout>
            <h1>Request an account</h1>
            <p className="muted">Ask for access to RoomRelay AI. An administrator reviews every request.</p>

            <Banner tone="warning">
                <strong>Prototype.</strong> Your request is checked but not saved or sent. There is no password to choose:
                you will sign in with your ServiceNow login once an administrator approves you.
            </Banner>

            {accepted ? (
                <div className="form" role="status">
                    <h2>Request checked</h2>
                    <p>
                        In the live app, this request would go to a System Administrator. They decide your role, so the role
                        below is only your request.
                    </p>
                    <dl className="facts facts--stacked review-list">
                        <div>
                            <dt>Name</dt>
                            <dd>{accepted.fullName}</dd>
                        </div>
                        <div>
                            <dt>Work email</dt>
                            <dd>{accepted.email}</dd>
                        </div>
                        <div>
                            <dt>Role requested</dt>
                            <dd>{ROLE_LABEL[accepted.role]}</dd>
                        </div>
                        <div>
                            <dt>Usual shift</dt>
                            <dd>{SHIFT_LABEL[accepted.shift]}</dd>
                        </div>
                        <div>
                            <dt>Reason</dt>
                            <dd className="preserve-lines">{accepted.reason}</dd>
                        </div>
                    </dl>
                    <p className="auth__alt">
                        <a className="link" href="#/login">Back to sign in</a>
                    </p>
                </div>
            ) : (
                <form className="form" onSubmit={submit} noValidate>
                    <ErrorSummary errors={errors} fieldIds={FIELD_IDS} />
                    <TextInput
                        id={FIELD_IDS.fullName}
                        label="Full name"
                        required
                        value={fullName}
                        maxLength={ACCOUNT_LIMITS.nameMax}
                        error={errors.fullName}
                        onChange={setFullName}
                    />
                    <TextInput
                        id={FIELD_IDS.email}
                        label="Work email"
                        required
                        hint="Use your hotel email address."
                        value={email}
                        maxLength={ACCOUNT_LIMITS.emailMax}
                        error={errors.email}
                        onChange={setEmail}
                    />
                    <SelectInput
                        id={FIELD_IDS.role}
                        label="Role you need"
                        required
                        hint="An administrator confirms your role. Administrator accounts are created by IT."
                        value={role}
                        placeholder="Choose a role"
                        error={errors.role}
                        options={REQUESTABLE_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
                        onChange={setRole}
                    />
                    <SelectInput
                        id={FIELD_IDS.shift}
                        label="Usual shift"
                        required
                        value={shift}
                        placeholder="Choose a shift"
                        error={errors.shift}
                        options={SHIFTS.map((s) => ({ value: s, label: SHIFT_LABEL[s] }))}
                        onChange={setShift}
                    />
                    <TextArea
                        id={FIELD_IDS.reason}
                        label="Reason for access"
                        required
                        hint="For example your job and which floors or tasks you cover."
                        rows={3}
                        value={reason}
                        maxLength={ACCOUNT_LIMITS.reasonMax}
                        error={errors.reason}
                        onChange={setReason}
                    />
                    <div className="form__actions">
                        <button type="submit" className="btn btn--primary">
                            Check request
                        </button>
                        <a className="link" href="#/login">
                            Back to sign in
                        </a>
                    </div>
                </form>
            )}
        </AuthLayout>
    )
}
