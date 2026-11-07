import React, { useMemo } from 'react'
import { DataGate } from '../../shared/api/DataContext'
import type { ReadyData } from '../../shared/api/DataContext'
import { APP_MODE } from '../../shared/api/environment'
import { ROLE_LABEL, SHIFT_LABEL } from '../../shared/domain/labels'
import type { Snapshot, Staff } from '../../shared/domain/types'
import { LEVEL_LABEL, PERMISSIONS, PERMISSION_ROLES } from './permissions'
import type { Level } from './permissions'
import { Badge } from '../../shared/ui/Badge'

const LEVEL_TONE: Record<Level, 'success' | 'info' | 'neutral'> = { yes: 'success', own: 'info', read: 'neutral', no: 'neutral' }

/** ServiceNow's own user list, where the administrator creates accounts and grants roles. */
const USER_ADMIN_URL = '/now/nav/ui/classic/params/target/sys_user_list.do'

export function AccessScreen() {
    return <DataGate loadingLabel="Loading staff accounts">{(data) => <Access data={data} />}</DataGate>
}

/** What each person is currently responsible for, so the administrator sees the workload at a glance. */
function workload(person: Staff, snapshot: Snapshot): string {
    if (person.role === 'housekeeping') {
        const rooms = snapshot.rooms.filter((r) => r.assigneeId === person.id).length
        return `${rooms} room${rooms === 1 ? '' : 's'} assigned`
    }
    if (person.role === 'maintenance') {
        const open = snapshot.defects.filter((d) => d.technicianId === person.id && d.status !== 'resolved').length
        return `${open} open repair${open === 1 ? '' : 's'}`
    }
    return '—'
}

/**
 * Users and Roles (administrator only). Accounts are not requested or created in RoomRelay:
 * the hotel's ServiceNow administrator creates each staff member as a ServiceNow user and grants
 * one RoomRelay role. This page lists who has access and what each role can do.
 */
function Access({ data }: { data: ReadyData }) {
    const { snapshot } = data

    const accounts = useMemo(
        () => [...snapshot.staff].sort((a, b) => PERMISSION_ROLES.indexOf(a.role) - PERMISSION_ROLES.indexOf(b.role) || a.name.localeCompare(b.name)),
        [snapshot.staff]
    )

    return (
        <div className="stack">
            <div className="grid grid--wide">
                <section className="card" aria-labelledby="h-accounts">
                    <h2 id="h-accounts">Staff accounts ({accounts.length})</h2>
                    <div className="table-wrap">
                        <table className="table table--stack">
                            <caption className="sr-only">Staff accounts with access to RoomRelay</caption>
                            <thead>
                                <tr>
                                    <th scope="col">Name</th>
                                    <th scope="col">Role</th>
                                    <th scope="col">Shift</th>
                                    <th scope="col">Current work</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.map((s) => (
                                    <tr key={s.id}>
                                        <th scope="row">{s.name}</th>
                                        <td data-label="Role">{ROLE_LABEL[s.role]}</td>
                                        <td data-label="Shift">{SHIFT_LABEL[s.shift]}</td>
                                        <td data-label="Current work">{workload(s, snapshot)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="card" aria-labelledby="h-manage">
                    <h2 id="h-manage">Adding or changing an account</h2>
                    <p>
                        RoomRelay is for hotel staff only, so there is no self-registration. The system administrator manages every
                        account in ServiceNow:
                    </p>
                    <ol className="steps">
                        <li>Create the person as a ServiceNow user (User Administration &gt; Users).</li>
                        <li>
                            Grant exactly one RoomRelay role: Housekeeping Staff, Maintenance Staff, Housekeeping Supervisor or System
                            Administrator.
                        </li>
                        <li>Add a RoomRelay staff profile with their shift, so they appear in assignments and briefings.</li>
                        <li>When someone leaves, deactivate the user. Their history stays in the audit log.</li>
                    </ol>
                    {APP_MODE === 'servicenow' ? (
                        <p>
                            <a className="link" href={USER_ADMIN_URL} target="_blank" rel="noopener noreferrer">
                                Open ServiceNow user administration
                            </a>
                        </p>
                    ) : null}
                </section>
            </div>

            <section className="card" aria-labelledby="h-matrix">
                <h2 id="h-matrix">Role permissions</h2>
                <p className="muted matrix-note">
                    What each role can do. The ServiceNow server enforces these rules on every request; the screens only show the
                    actions a role is allowed to take.
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
        </div>
    )
}
