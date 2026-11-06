import type { Role } from '../../shared/domain/types.ts'

/**
 * Role-permission matrix, for DISPLAY.
 *
 * It documents who may do what, for the Users and Access page. It is not enforcement: the
 * ServiceNow roles, ACLs and the command rules (features/<slice>/*Commands.ts) enforce it.
 * Keep this table and those rules in step.
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
    { action: 'View rooms, room details and checklists', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'yes', admin: 'read' } },
    { action: 'Complete a task, or mark it Couldn\'t Complete', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'no', admin: 'no' } },
    { action: 'Set a Couldn\'t Complete task back to Pending', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'View maintenance defects', levels: { housekeeping: 'own', maintenance: 'own', supervisor: 'yes', admin: 'read' } },
    { action: 'Report a defect', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Triage a defect (assign a technician, set the priority)', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Start a repair and record the resolution', levels: { housekeeping: 'no', maintenance: 'own', supervisor: 'no', admin: 'no' } },
    { action: 'Submit a room for inspection', levels: { housekeeping: 'own', maintenance: 'no', supervisor: 'no', admin: 'no' } },
    { action: 'Pass or fail an inspection (Ready only when every rule is met)', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Generate a shift handoff briefing', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'yes', admin: 'no' } },
    { action: 'Manage accounts, roles and access requests', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'no', admin: 'yes' } },
    { action: 'View the audit log', levels: { housekeeping: 'no', maintenance: 'no', supervisor: 'no', admin: 'read' } },
]
