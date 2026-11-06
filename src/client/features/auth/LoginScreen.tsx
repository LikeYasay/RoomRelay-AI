import React, { useState } from 'react'
import { useAuth } from '../../app/session'
import { STAFF } from '../../data/mockData'
import { ROLE_LABEL } from '../../domain/labels'
import type { Role } from '../../types/domain'
import { Banner } from '../../components/ui/Banner'
import { ErrorSummary, SelectInput } from '../../components/ui/FormFields'
import { AuthLayout } from './AuthLayout'

const ROLE_ORDER: Role[] = ['supervisor', 'housekeeping', 'maintenance', 'admin']

const ACCOUNT_OPTIONS = [...STAFF]
    .sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.name.localeCompare(b.name))
    .map((s) => ({ value: s.id, label: `${s.name} (${ROLE_LABEL[s.role]})` }))

/**
 * PROTOTYPE sign-in. The live app uses ServiceNow's own login page, so this client never
 * asks for, sends or stores a password. Here you pick a synthetic demo account instead.
 */
export function LoginScreen() {
    const { signIn, notice } = useAuth()
    const [accountId, setAccountId] = useState('')
    const [error, setError] = useState<string | undefined>()

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        if (accountId === '') {
            setError('Choose a demo account to sign in.')
            return
        }
        if (!signIn(accountId)) setError('That account is not available. Choose one from the list.')
    }

    return (
        <AuthLayout>
            <h1>Sign in</h1>
            <p className="muted">Sign in to see room readiness, tasks and handoffs for your role.</p>

            {notice ? (
                <Banner tone="warning">{notice}</Banner>
            ) : null}

            <Banner tone="info">
                <strong>Prototype sign-in.</strong> The live system uses your ServiceNow login. This page never asks for a
                password. Pick a demo account to see the app as that role.
            </Banner>

            <form className="form" onSubmit={submit} noValidate>
                <ErrorSummary errors={{ account: error }} fieldIds={{ account: 'demo-account' }} />
                <SelectInput
                    id="demo-account"
                    label="Demo account"
                    required
                    value={accountId}
                    placeholder="Choose an account"
                    error={error}
                    options={ACCOUNT_OPTIONS}
                    onChange={(v) => {
                        setAccountId(v)
                        setError(undefined)
                    }}
                />
                <div className="form__actions">
                    <button type="submit" className="btn btn--primary">
                        Sign in
                    </button>
                </div>
            </form>

            <p className="auth__alt">
                Need access? <a className="link" href="#/signup">Request an account</a>
            </p>
        </AuthLayout>
    )
}
