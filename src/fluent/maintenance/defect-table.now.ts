import '@servicenow/sdk/global'
import { Acl, ChoiceColumn, DateTimeColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'
import { appAdminRole } from '../auth/roles.now'

/** Maintenance defects. Only priority "blocking" affects room readiness. */
export const x_2305075_roomrela_defect = Table({
    name: 'x_2305075_roomrela_defect',
    label: 'RoomRelay Defect',
    display: 'title',
    allowWebServiceAccess: false, // all access goes through the RoomRelay REST API
    schema: {
        code: StringColumn({ label: 'Code', maxLength: 20, mandatory: true }), // the id the app uses, e.g. D-305-1
        room: ReferenceColumn({ label: 'Room', referenceTable: 'x_2305075_roomrela_room', mandatory: true }),
        title: StringColumn({ label: 'Title', maxLength: 100, mandatory: true }),
        description: StringColumn({ label: 'Description', maxLength: 1000 }),
        priority: ChoiceColumn({ label: 'Priority', choices: { blocking: 'Blocking', normal: 'Normal', minor: 'Minor' }, default: 'normal' }),
        status: ChoiceColumn({
            label: 'Status',
            choices: { new: 'New', assigned: 'Assigned', in_progress: 'In progress', resolved: 'Resolved' },
            default: 'new',
        }),
        reported_by: ReferenceColumn({ label: 'Reported by', referenceTable: 'sys_user' }),
        reported_at: DateTimeColumn({ label: 'Reported' }),
        technician: ReferenceColumn({ label: 'Technician', referenceTable: 'sys_user' }),
        assigned_by: ReferenceColumn({ label: 'Assigned by', referenceTable: 'sys_user' }),
        assigned_at: DateTimeColumn({ label: 'Assigned' }),
        started_at: DateTimeColumn({ label: 'Work started' }),
        resolved_at: DateTimeColumn({ label: 'Resolved' }),
        resolution_notes: StringColumn({ label: 'Resolution notes', maxLength: 500 }),
        source_task: ReferenceColumn({ label: 'Raised from task', referenceTable: 'x_2305075_roomrela_task' }),
    },
})

// Read-only direct access for the RoomRelay administrator; staff go through the REST API.
Acl({
    $id: Now.ID['defect-read-acl'],
    type: 'record',
    table: 'x_2305075_roomrela_defect',
    operation: 'read',
    roles: [appAdminRole],
})
