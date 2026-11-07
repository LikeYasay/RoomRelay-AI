import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'
import { ALL_APP_ROLES } from '../auth/roles.now'

// Modules are plain records, so their roles are written as role names.
const ALL_ROLE_NAMES = [
    'x_2305075_roomrela.housekeeper',
    'x_2305075_roomrela.maintenance',
    'x_2305075_roomrela.supervisor',
    'x_2305075_roomrela.app_admin',
]

/**
 * The "RoomRelay AI" entry in ServiceNow's All menu, so staff open the app with a click inside
 * the platform (same tab) instead of typing its address. Only people with a RoomRelay role see it
 * (platform admins see every menu).
 */
const roomRelayMenu = ApplicationMenu({
    $id: Now.ID['roomrelay-menu'],
    title: 'RoomRelay AI',
    hint: 'Room readiness and shift handoff',
    description: 'Hotel room readiness, housekeeping, maintenance and AI shift handoff.',
    roles: ALL_APP_ROLES,
    active: true,
    order: 100,
})

// Opens the app inside the ServiceNow page (no window name, so it stays in the same tab).
Record({
    $id: Now.ID['roomrelay-module-open'],
    table: 'sys_app_module',
    data: {
        title: 'Open RoomRelay',
        application: roomRelayMenu,
        link_type: 'DIRECT',
        query: 'x_2305075_roomrela_incident_manager.do',
        hint: 'Dashboard, rooms, maintenance and shift handoff',
        roles: ALL_ROLE_NAMES,
        order: 100,
        active: true,
    },
})

// For the administrator: the staff profiles (shift per person), used when adding a new staff member.
Record({
    $id: Now.ID['roomrelay-module-staff'],
    table: 'sys_app_module',
    data: {
        title: 'Staff Profiles',
        application: roomRelayMenu,
        link_type: 'LIST',
        name: 'x_2305075_roomrela_staff',
        hint: 'Shift for each RoomRelay staff member',
        roles: ['x_2305075_roomrela.app_admin'],
        order: 200,
        active: true,
    },
})
