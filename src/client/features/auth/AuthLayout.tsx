import React from 'react'
import type { ReactNode } from 'react'
import { ROLE_LABEL } from '../../shared/domain/labels'
import type { Role } from '../../shared/domain/types'
import { PixelBackground } from './PixelBackground'

const ROLE_DESCRIPTION: Record<Role, string> = {
    housekeeping: "Cleans assigned rooms, ticks off the checklist (or marks a task Couldn't Complete with a reason), reports defects and submits rooms for inspection.",
    maintenance: 'Works through the repairs assigned to them and records how each was resolved.',
    supervisor: 'Triages defect reports, inspects rooms and confirms them Ready, and runs shift handoffs.',
    admin: 'Manages staff accounts, roles and access requests, and reviews the audit log. Accounts of this type are created by IT.',
}

const ROLES: Role[] = ['housekeeping', 'maintenance', 'supervisor', 'admin']

/**
 * Signed-out page frame. The form and the "who can use this" information share ONE white
 * panel (form on the left, information on the right), centered on the page over a
 * pixel-grid backdrop. On narrow screens the information stacks under the form.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="auth">
            <PixelBackground />
            <header className="auth__bar">
                <span className="brand">RoomRelay AI</span>
                <span className="chip chip--prototype">Prototype: synthetic data</span>
            </header>
            <main className="auth__main" id="main-content">
                <div className="auth__panel">
                    <div className="auth__form">{children}</div>
                    <aside className="auth__info" aria-labelledby="who-heading">
                        <h2 id="who-heading">Who can use RoomRelay AI</h2>
                        <p>
                            Access is limited to authorized hotel staff. There is no guest or public access, and everyone
                            signs in as a named person.
                        </p>
                        <dl className="auth__roles">
                            {ROLES.map((r) => (
                                <div key={r}>
                                    <dt>{ROLE_LABEL[r]}</dt>
                                    <dd>{ROLE_DESCRIPTION[r]}</dd>
                                </div>
                            ))}
                        </dl>
                        <p className="auth__note">
                            Roles are granted by a System Administrator. You can ask for a role when you request an
                            account, but you cannot give yourself one.
                        </p>
                    </aside>
                </div>
            </main>
        </div>
    )
}
