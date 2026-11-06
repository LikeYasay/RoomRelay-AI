import '@servicenow/sdk/global'
import { Acl, BooleanColumn, ChoiceColumn, DateTimeColumn, ReferenceColumn, StringColumn, Table } from '@servicenow/sdk/core'
import { appAdminRole } from '../auth/roles.now'

/** Housekeeping checklist tasks, one row per task per room. */
export const x_2305075_roomrela_task = Table({
    name: 'x_2305075_roomrela_task',
    label: 'RoomRelay Housekeeping Task',
    display: 'title',
    allowWebServiceAccess: false, // all access goes through the RoomRelay REST API
    schema: {
        code: StringColumn({ label: 'Code', maxLength: 20, mandatory: true }), // the id the app uses, e.g. T-305-1
        room: ReferenceColumn({ label: 'Room', referenceTable: 'x_2305075_roomrela_room', mandatory: true }),
        title: StringColumn({ label: 'Title', maxLength: 100, mandatory: true }),
        description: StringColumn({ label: 'Description', maxLength: 300 }),
        mandatory: BooleanColumn({ label: 'Mandatory', default: true }),
        priority: ChoiceColumn({ label: 'Priority', choices: { high: 'High', normal: 'Normal', low: 'Low' }, default: 'normal' }),
        status: ChoiceColumn({
            label: 'Status',
            choices: { pending: 'Pending', completed: 'Completed', couldnt_complete: "Couldn't Complete" },
            default: 'pending',
        }),
        assigned_to: ReferenceColumn({ label: 'Assigned to', referenceTable: 'sys_user' }),
        completed_at: DateTimeColumn({ label: 'Completed' }),
        incomplete_reason: ChoiceColumn({
            label: "Couldn't Complete reason",
            choices: { supplies_missing: 'Supplies missing', needs_maintenance: 'Needs maintenance', other: 'Other' },
        }),
        incomplete_note: StringColumn({ label: "Couldn't Complete note", maxLength: 300 }), // untrusted free text; never sent to AI
        incomplete_at: DateTimeColumn({ label: "Marked Couldn't Complete" }),
        linked_defect: ReferenceColumn({ label: 'Maintenance report', referenceTable: 'x_2305075_roomrela_defect' }),
        repair_note: StringColumn({ label: 'Repair note', maxLength: 500 }),
    },
})

// Read-only direct access for the RoomRelay administrator; staff go through the REST API.
Acl({
    $id: Now.ID['task-read-acl'],
    type: 'record',
    table: 'x_2305075_roomrela_task',
    operation: 'read',
    roles: [appAdminRole],
})
