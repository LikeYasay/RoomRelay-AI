import '@servicenow/sdk/global'
import { Acl, ChoiceColumn, CrossScopePrivilege, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'
import { appAdminRole } from './roles.now'

/**
 * Staff profile: the RoomRelay details of a ServiceNow user (their shift). Name comes from
 * sys_user and the role from the user's assigned RoomRelay role, so neither is duplicated here.
 */
export const x_2305075_roomrela_staff = Table({
    name: 'x_2305075_roomrela_staff',
    label: 'RoomRelay Staff Profile',
    display: 'user',
    allowWebServiceAccess: false,
    schema: {
        user: ReferenceColumn({ label: 'User', referenceTable: 'sys_user', mandatory: true }),
        shift: ChoiceColumn({
            label: 'Shift',
            choices: { morning: 'Morning', afternoon: 'Afternoon', night: 'Night' },
            default: 'morning',
        }),
        // Links a demo user to the synthetic dataset (h1, s1, ...). Empty for real staff.
        demo_key: StringColumn({ label: 'Demo key', maxLength: 10 }),
    },
})

// The RoomRelay administrator maintains staff profiles (shifts) in the platform.
Acl({ $id: Now.ID['staff-read-acl'], type: 'record', table: 'x_2305075_roomrela_staff', operation: 'read', roles: [appAdminRole] })
Acl({ $id: Now.ID['staff-write-acl'], type: 'record', table: 'x_2305075_roomrela_staff', operation: 'write', roles: [appAdminRole] })
Acl({ $id: Now.ID['staff-create-acl'], type: 'record', table: 'x_2305075_roomrela_staff', operation: 'create', roles: [appAdminRole] })

// The server reads user names and role assignments from global tables (read only).
CrossScopePrivilege({
    $id: Now.ID['xs-read-sys-user'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sys_user',
    targetScope: 'global',
    targetType: 'sys_db_object',
})
CrossScopePrivilege({
    $id: Now.ID['xs-read-sys-user-has-role'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sys_user_has_role',
    targetScope: 'global',
    targetType: 'sys_db_object',
})
