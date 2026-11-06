/** Table and role names, in one place. They must match src/fluent/. */

export const TABLES = {
    room: 'x_2305075_roomrela_room',
    task: 'x_2305075_roomrela_task',
    defect: 'x_2305075_roomrela_defect',
    audit: 'x_2305075_roomrela_audit',
    staff: 'x_2305075_roomrela_staff',
} as const

export const ROLE_NAMES = {
    admin: 'x_2305075_roomrela.app_admin',
    supervisor: 'x_2305075_roomrela.supervisor',
    maintenance: 'x_2305075_roomrela.maintenance',
    housekeeping: 'x_2305075_roomrela.housekeeper',
} as const
