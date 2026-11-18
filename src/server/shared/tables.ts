/** Table and role names, in one place. They must match src/fluent/. */

export const TABLES = {
    room: 'x_2318724_roomrela_room',
    task: 'x_2318724_roomrela_task',
    defect: 'x_2318724_roomrela_defect',
    audit: 'x_2318724_roomrela_audit',
    staff: 'x_2318724_roomrela_staff',
} as const

export const ROLE_NAMES = {
    admin: 'x_2318724_roomrela.app_admin',
    supervisor: 'x_2318724_roomrela.supervisor',
    maintenance: 'x_2318724_roomrela.maintenance',
    housekeeping: 'x_2318724_roomrela.housekeeper',
} as const
