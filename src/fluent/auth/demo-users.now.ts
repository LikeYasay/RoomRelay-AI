import '@servicenow/sdk/global'
import { Record } from '@servicenow/sdk/core'
import { appAdminRole, housekeeperRole, maintenanceRole, supervisorRole } from './roles.now'

/**
 * DEMO DATA: the nine synthetic staff from src/client/mock/mockData.ts as real ServiceNow users,
 * each with one RoomRelay role and a staff profile. They have NO password, so nobody can sign in
 * as them directly: an administrator tests each role with "Impersonate User".
 * Remove this file (and reinstall) before any real use.
 */

const avery = Record({
    $id: Now.ID['demo-user-h1'],
    table: 'sys_user',
    data: { user_name: 'avery.collins', first_name: 'Avery', last_name: 'Collins', active: true },
})
const jordan = Record({
    $id: Now.ID['demo-user-h2'],
    table: 'sys_user',
    data: { user_name: 'jordan.reyes', first_name: 'Jordan', last_name: 'Reyes', active: true },
})
const priya = Record({
    $id: Now.ID['demo-user-h3'],
    table: 'sys_user',
    data: { user_name: 'priya.nair', first_name: 'Priya', last_name: 'Nair', active: true },
})
const tomasz = Record({
    $id: Now.ID['demo-user-h4'],
    table: 'sys_user',
    data: { user_name: 'tomasz.kowalski', first_name: 'Tomasz', last_name: 'Kowalski', active: true },
})
const lena = Record({
    $id: Now.ID['demo-user-h5'],
    table: 'sys_user',
    data: { user_name: 'lena.okafor', first_name: 'Lena', last_name: 'Okafor', active: true },
})
const daniel = Record({
    $id: Now.ID['demo-user-m1'],
    table: 'sys_user',
    data: { user_name: 'daniel.brooks', first_name: 'Daniel', last_name: 'Brooks', active: true },
})
const sofia = Record({
    $id: Now.ID['demo-user-m2'],
    table: 'sys_user',
    data: { user_name: 'sofia.marques', first_name: 'Sofia', last_name: 'Marques', active: true },
})
const morgan = Record({
    $id: Now.ID['demo-user-s1'],
    table: 'sys_user',
    data: { user_name: 'morgan.ellis', first_name: 'Morgan', last_name: 'Ellis', active: true },
})
const riley = Record({
    $id: Now.ID['demo-user-a1'],
    table: 'sys_user',
    data: { user_name: 'riley.chen', first_name: 'Riley', last_name: 'Chen', active: true },
})

// One role per person.
Record({ $id: Now.ID['demo-role-h1'], table: 'sys_user_has_role', data: { user: avery, role: housekeeperRole } })
Record({ $id: Now.ID['demo-role-h2'], table: 'sys_user_has_role', data: { user: jordan, role: housekeeperRole } })
Record({ $id: Now.ID['demo-role-h3'], table: 'sys_user_has_role', data: { user: priya, role: housekeeperRole } })
Record({ $id: Now.ID['demo-role-h4'], table: 'sys_user_has_role', data: { user: tomasz, role: housekeeperRole } })
Record({ $id: Now.ID['demo-role-h5'], table: 'sys_user_has_role', data: { user: lena, role: housekeeperRole } })
Record({ $id: Now.ID['demo-role-m1'], table: 'sys_user_has_role', data: { user: daniel, role: maintenanceRole } })
Record({ $id: Now.ID['demo-role-m2'], table: 'sys_user_has_role', data: { user: sofia, role: maintenanceRole } })
Record({ $id: Now.ID['demo-role-s1'], table: 'sys_user_has_role', data: { user: morgan, role: supervisorRole } })
Record({ $id: Now.ID['demo-role-a1'], table: 'sys_user_has_role', data: { user: riley, role: appAdminRole } })

// Staff profiles: shift, plus the demo key that links each person to the synthetic dataset.
const STAFF = 'x_2305075_roomrela_staff'
Record({ $id: Now.ID['demo-staff-h1'], table: STAFF, data: { user: avery, shift: 'morning', demo_key: 'h1' } })
Record({ $id: Now.ID['demo-staff-h2'], table: STAFF, data: { user: jordan, shift: 'morning', demo_key: 'h2' } })
Record({ $id: Now.ID['demo-staff-h3'], table: STAFF, data: { user: priya, shift: 'afternoon', demo_key: 'h3' } })
Record({ $id: Now.ID['demo-staff-h4'], table: STAFF, data: { user: tomasz, shift: 'afternoon', demo_key: 'h4' } })
Record({ $id: Now.ID['demo-staff-h5'], table: STAFF, data: { user: lena, shift: 'night', demo_key: 'h5' } })
Record({ $id: Now.ID['demo-staff-m1'], table: STAFF, data: { user: daniel, shift: 'morning', demo_key: 'm1' } })
Record({ $id: Now.ID['demo-staff-m2'], table: STAFF, data: { user: sofia, shift: 'afternoon', demo_key: 'm2' } })
Record({ $id: Now.ID['demo-staff-s1'], table: STAFF, data: { user: morgan, shift: 'morning', demo_key: 's1' } })
Record({ $id: Now.ID['demo-staff-a1'], table: STAFF, data: { user: riley, shift: 'morning', demo_key: 'a1' } })
