import '@servicenow/sdk/global'
import { Acl, ChoiceColumn, DateTimeColumn, IntegerColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'
import { appAdminRole } from '../auth/roles.now'

/**
 * Hotel rooms. Readiness status is NOT stored: the server derives it from tasks, defects and
 * the inspection every time (src/client/features/rooms/readiness.ts), so it can never be stale.
 */
export const x_2318724_roomrela_room = Table({
    name: 'x_2318724_roomrela_room',
    label: 'RoomRelay Room',
    display: 'number',
    allowWebServiceAccess: false, // all access goes through the RoomRelay REST API
    schema: {
        number: StringColumn({ label: 'Room number', maxLength: 4, mandatory: true }),
        floor: IntegerColumn({ label: 'Floor', mandatory: true }),
        room_type: StringColumn({ label: 'Room type', maxLength: 40 }),
        assigned_to: ReferenceColumn({ label: 'Assigned housekeeper', referenceTable: 'sys_user' }),
        inspection: ChoiceColumn({
            label: 'Inspection',
            choices: { not_requested: 'Not requested', pending: 'Pending', passed: 'Passed', failed: 'Failed' },
            default: 'not_requested',
        }),
        inspection_at: DateTimeColumn({ label: 'Inspection updated' }),
    },
})

// Direct table access (lists, forms, Table API) is read-only and for the RoomRelay administrator.
// Staff read and change rooms only through the REST API, which applies the role and ownership rules.
Acl({
    $id: Now.ID['room-read-acl'],
    type: 'record',
    table: 'x_2318724_roomrela_room',
    operation: 'read',
    roles: [appAdminRole],
})
