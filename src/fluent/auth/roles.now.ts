import '@servicenow/sdk/global'
import { Role } from '@servicenow/sdk/core'

/**
 * The four RoomRelay AI roles. One role per person; roles never contain each other
 * (least privilege). The server maps them to the frontend's role names in
 * src/server/shared/session.ts.
 */

export const housekeeperRole = Role({
    name: 'x_2305075_roomrela.housekeeper',
    description: 'Housekeeping Staff: works the checklist of their own rooms, reports defects, submits rooms for inspection.',
})

export const maintenanceRole = Role({
    name: 'x_2305075_roomrela.maintenance',
    description: 'Maintenance Staff: starts and resolves the defects assigned to them.',
})

export const supervisorRole = Role({
    name: 'x_2305075_roomrela.supervisor',
    description: 'Housekeeping Supervisor: triages defects, passes or fails inspections, runs shift handoffs.',
})

export const appAdminRole = Role({
    name: 'x_2305075_roomrela.app_admin',
    description: 'RoomRelay administrator: reviews the audit log, manages access, views operations read-only.',
})

/** Every RoomRelay role, for ACLs that any signed-in staff member passes. */
export const ALL_APP_ROLES = [housekeeperRole, maintenanceRole, supervisorRole, appAdminRole]
