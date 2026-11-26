import '@servicenow/sdk/global'
import { EmailNotification, Record } from '@servicenow/sdk/core'
import { morgan } from '../auth/demo-users.now'

/**
 * RoomRelay email notifications. Each one is sent by a Flow (src/fluent/flows/roomrelay-flows.now.ts)
 * with the "Send Notification" action, so the notifications have "Send when: Triggered" and only
 * say WHO receives the email and WHAT it says. They only inform people: they never change data
 * and never decide whether a room is Ready (the readiness rules do that).
 *
 * The staff accounts installed with the app have placeholder @example.com addresses (a reserved
 * domain that never reaches a real mailbox), so the emails can be checked in System Logs > Emails.
 */

/** Supervisors who triage new defects. Membership is managed in ServiceNow like any group. */
export const supervisorsGroup = Record({
    $id: Now.ID['roomrelay-supervisors-group'],
    table: 'sys_user_group',
    data: {
        name: 'RoomRelay Supervisors',
        description: 'Housekeeping supervisors who receive RoomRelay "new defect to triage" emails.',
        active: true,
    },
})

Record({
    $id: Now.ID['roomrelay-supervisors-member-s1'],
    table: 'sys_user_grmember',
    data: { group: supervisorsGroup, user: morgan },
})

/** To the technician, when a defect is assigned (or reassigned) to them. */
export const repairAssignedNotification = EmailNotification({
    $id: Now.ID['roomrelay-notification-repair-assigned'],
    table: 'x_2318724_roomrela_defect',
    name: 'RoomRelay - Repair assigned to you',
    description: 'Sent by the flow "RoomRelay - Notify technician of assigned repair" to the defect\'s technician.',
    triggerConditions: { generationType: 'triggered' },
    recipientDetails: { recipientFields: ['technician'], sendToCreator: true },
    emailContent: {
        subject: 'RoomRelay: repair assigned in Room ${room.number} (${priority})',
        messageHtml: Now.include('./emails/repair-assigned.html'),
    },
})

/** To the RoomRelay Supervisors group, when staff report a defect that still needs triage. */
export const newDefectNotification = EmailNotification({
    $id: Now.ID['roomrelay-notification-new-defect'],
    table: 'x_2318724_roomrela_defect',
    name: 'RoomRelay - New defect to triage',
    description: 'Sent by the flow "RoomRelay - Notify supervisors of new defect" to the RoomRelay Supervisors group.',
    triggerConditions: { generationType: 'triggered' },
    recipientDetails: { recipientGroups: [supervisorsGroup], sendToCreator: true },
    emailContent: {
        subject: 'RoomRelay: new defect in Room ${room.number} needs triage',
        messageHtml: Now.include('./emails/new-defect.html'),
    },
})

/** To the room's housekeeper, when the supervisor fails the inspection. */
export const inspectionFailedNotification = EmailNotification({
    $id: Now.ID['roomrelay-notification-inspection-failed'],
    table: 'x_2318724_roomrela_room',
    name: 'RoomRelay - Inspection failed',
    description: 'Sent by the flow "RoomRelay - Notify housekeeper of failed inspection" to the room\'s housekeeper.',
    triggerConditions: { generationType: 'triggered' },
    recipientDetails: { recipientFields: ['assigned_to'], sendToCreator: true },
    emailContent: {
        subject: 'RoomRelay: Room ${number} failed inspection',
        messageHtml: Now.include('./emails/inspection-failed.html'),
    },
})
