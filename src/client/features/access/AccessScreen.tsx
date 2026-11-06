import React, { useMemo, useState } from 'react'
import { DataGate } from '../../app/data'
import type { ReadyData } from '../../app/data'
import { PENDING_REQUESTS } from '../../data/mockAccess'
import type { AccessRequest } from '../../data/mockAccess'
import { formatAgo } from '../../domain/format'
import { ROLE_LABEL, SHIFT_LABEL } from '../../domain/labels'
import { LEVEL_LABEL, PERMISSIONS, PERMISSION_ROLES } from '../../domain/permissions'
import type { Level } from '../../domain/permissions'
import { Badge } from '../../components/ui/Badge'
import { Banner } from '../../components/ui/Banner'
import { SimulationDialog } from '../../components/ui/SimulationDialog'

type Decision = { request: AccessRequest; verb: 'Approve' | 'Decline' }

const LEVEL_TONE: Record<Level, 'success' | 'info' | 'neutral'> = { yes: 'success', own: 'info', read: 'neutral', no: 'neutral' }

export function AccessScreen() {
    return <DataGate loadingLabel="Loading accounts">{(data) => <Access data={data} />}</DataGate>
}

function Access({ data }: { data: ReadyData }) {
    const { snapshot } = data
    const [decision, setDecision] = useState<Decision | null>(null)

    const accounts = useMemo(
        () => [...snapshot.staff].sort((a, b) => a.role.localeCompare(b.role) || a.name.localeCompare(b.name)),
        [snapshot.staff]
    )

    return (
        <div className="stack">
            <Banner tone="info">
                <strong>Prototype.</strong> Accounts and requests are synthetic. Approving, declining and role changes are
                simulated. In the live system ServiceNow users, roles and groups are the source of truth.
            </Banner>

            <div className="grid grid--wide">
                <section className="card" aria-labelledby="h-requests">
                    <h2 id="h-requests">Pending access requests ({PENDING_REQUESTS.length})</h2>
                    <div className="table-wrap">
                        <table className="table table--stack">
                            <caption className="sr-only">Pending access requests</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Person</th>
                                    <th scope="col">Role requested</th>
                                    <th scope="col">Shift</th>
                                    <th scope="col">Reason</th>
                                    <th scope="col">Submitted</th>
                                    <th scope="col">Decision</th>
                                </tr>
                            </thead>
                            <tbody>
                                {PENDING_REQUESTS.map((r) => (
                                    <tr key={r.id}>
                                        <th scope="row">
                                            {/* Request text is untrusted input; React renders it as plain text. */}
                                            {r.fullName}
                                            <span className="muted table__sub">{r.email}</span>
                                        </th>
                                        <td data-label="Role requested">{ROLE_LABEL[r.role]}</td>
                                        <td data-label="Shift">{SHIFT_LABEL[r.shift]}</td>
                                        <td className="table__notes" data-label="Reason">{r.reason}</td>
                                        <td data-label="Submitted">
                                            {formatAgo(
                                                new Date(Date.parse(snapshot.generatedAt) - r.submittedMinutesAgo * 60_000).toISOString(),
                                                snapshot.generatedAt
                                            )}
                                        </td>
                                        <td data-label="Decision">
                                            <div className="row-actions">
                                                <button type="button" className="btn btn--primary btn--small" onClick={() => setDecision({ request: r, verb: 'Approve' })}>
                                                    Approve
                                                </button>
                                                <button type="button" className="btn btn--ghost btn--flat btn--small" onClick={() => setDecision({ request: r, verb: 'Decline' })}>
                                                    Decline
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="card" aria-labelledby="h-accounts">
                    <h2 id="h-accounts">Staff accounts ({accounts.length})</h2>
                    <div className="table-wrap">
                        <table className="table table--stack">
                            <caption className="sr-only">Staff accounts</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Role</th>
                                    <th scope="col">Shift</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((s) => (
                                    <tr key={s.id}>
                                        <th scope="row">{s.name}</th>
                                        <td data-label="Role">{ROLE_LABEL[s.role]}</td>
                                        <td data-label="Shift">{SHIFT_LABEL[s.shift]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <section className="card" aria-labelledby="h-matrix">
                <h2 id="h-matrix">Role permissions</h2>
                <p className="muted matrix-note">
                    What each role is meant to be able to do. This table describes the design. The server must enforce it with
                    roles, ACLs and validation. Screens only follow it.
                </p>
                <div className="table-wrap">
                    <table className="table table--matrix">
                        <caption className="sr-only">Permissions by role</caption>
                        <thead>
                            <tr>
                                <th scope="col">Action</th>
                                {PERMISSION_ROLES.map((r) => (
                                    <th key={r} scope="col">
                                        {ROLE_LABEL[r]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERMISSIONS.map((row) => (
                                <tr key={row.action}>
                                    <th scope="row">{row.action}</th>
                                    {PERMISSION_ROLES.map((r) => (
                                        <td key={r}>
                                            <Badge
                                                tone={LEVEL_TONE[row.levels[r]]}
                                                label={LEVEL_LABEL[row.levels[r]]}
                                                icon={row.levels[r] === 'no' ? 'lock' : row.levels[r] === 'yes' ? 'check-circle' : 'info'}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {decision ? (
                <SimulationDialog
                    title={`${decision.verb} access request: ${decision.request.fullName}`}
                    intro={`${decision.verb} the request for the ${ROLE_LABEL[decision.request.role]} role? Run the simulation to see what this screen would do.`}
                    result={
                        decision.verb === 'Approve'
                            ? `Simulated result: ${decision.request.fullName} would be approved. In the live system the administrator creates the ServiceNow user and grants only the roles they decide; nothing was changed here.`
                            : `Simulated result: the request from ${decision.request.fullName} would be declined and the person told. Nothing was changed here.`
                    }
                    onClose={() => setDecision(null)}
                />
            ) : null}
        </div>
    )
}
