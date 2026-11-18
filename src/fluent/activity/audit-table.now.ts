import '@servicenow/sdk/global'
import { Acl, DateTimeColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'
import { appAdminRole } from '../auth/roles.now'

/**
 * Audit log: who did what, when. Rows are written only by the RoomRelay server code, in the
 * same request as the change they describe. No role is given write, create or delete access.
 */
export const x_2318724_roomrela_audit = Table({
    name: 'x_2318724_roomrela_audit',
    label: 'RoomRelay Audit Entry',
    display: 'summary',
    allowWebServiceAccess: false, // all access goes through the RoomRelay REST API
    schema: {
        at: DateTimeColumn({ label: 'When', mandatory: true }),
        actor: ReferenceColumn({ label: 'Who', referenceTable: 'sys_user', mandatory: true }),
        action: StringColumn({ label: 'Action', maxLength: 40, mandatory: true }), // an AuditAction from shared/domain/types.ts
        room: ReferenceColumn({ label: 'Room', referenceTable: 'x_2318724_roomrela_room' }),
        target: StringColumn({ label: 'Record', maxLength: 40 }), // task, defect or room code
        summary: StringColumn({ label: 'Details', maxLength: 300 }),
    },
})

Acl({
    $id: Now.ID['audit-read-acl'],
    type: 'record',
    table: 'x_2318724_roomrela_audit',
    operation: 'read',
    roles: [appAdminRole],
})
