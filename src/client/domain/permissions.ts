import type { Role } from '../types/domain'

/**
 * Role-permission matrix, for DISPLAY.
 *
 * It documents the intended design and matches what this prototype's screens show.
 * It is not enforcement: real permissions must be enforced by ServiceNow roles, ACLs and
 * server-side checks (Phase 4). Keep this table and those rules in step.
 */
export type Level = 'yes' | 'own' | 'read' | 'no'

export const LEVEL_LABEL: Record<Level, string> = {
    yes: 'Yes',
    own: 'Own or assigned only',
    read: 'View only',
    no: 'No',
}

export interface PermissionRow {
    action: string
    levels: Record<Role, Level>
}

export const PERMISSION_ROLES: Role[] = ['housekeeping', 'maintenance', 'supervisor', 'admin']

export const PERMISSIONS: PermissionRow[] = [
    { action: 'View the operations dashboard', levels: { housekeeping: 'own', maintenance: 'own', supervisor: 'yes', admin: 'read' } },
    { action: 'View room board and room details', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'yes', admin: 'read' } },
    { action: 'View housekeeping tasks', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'yes', admin: 'read' } },
    { action: 'View maintenance defects', levels: { housekeeping: 'own', maintenance: 'own', supervisor: 'yes', admin: 'read' } },
    { action: 'Report a defect', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Record a defect resolution', levels: { housekeeping: 'no', maintenance: 'own', supervisor: 'no', admin: 'no' } },
    { action: 'Submit a room for inspection', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'no', admin: 'no' } },
    { action: 'Confirm a room Ready (only when every rule is met)', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Generate a shift handoff briefing', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Manage accounts, roles and access requests', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'no', admin: 'yes' } },
]
