import '@servicenow/sdk/global'
import { action, Flow, trigger, wfa } from '@servicenow/sdk/automation'

/**
 * RoomRelay Flow Designer flows. Each one starts when a RoomRelay record changes and sends one
 * email notification (src/fluent/notifications/notifications.now.ts). They only inform people:
 * the REST API's rules still decide every change and whether a room is Ready.
 *
 * The notification is passed as its sys_id (from src/fluent/generated/keys.ts). Passing the notification
 * object makes the SDK copy the whole record into the flow, and Now.ID[...] is stored as the key text;
 * either way the flow cannot be activated.
 *
 * Restore initial data loads its records without running flows (setWorkflow(false) in
 * src/server/data/demoData.ts), so restoring the data does not send emails.
 */

const DEFECT = 'x_2318724_roomrela_defect'
const ROOM = 'x_2318724_roomrela_room'

// 1. A supervisor assigns (or reassigns) a defect: tell the technician.
Flow(
    {
        $id: Now.ID['roomrelay-flow-repair-assigned'],
        name: 'RoomRelay - Notify technician of assigned repair',
        description: 'When a RoomRelay defect gets a technician (new or changed), email that technician.',
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.createdOrUpdated,
        { $id: Now.ID['roomrelay-flow-repair-assigned-trigger'] },
        {
            table: DEFECT,
            condition: 'technicianISNOTEMPTY^technicianVALCHANGES^status!=resolved',
            trigger_strategy: 'unique_changes',
        }
    ),
    (params) => {
        wfa.action(
            action.core.sendNotification,
            { $id: Now.ID['roomrelay-flow-repair-assigned-send'] },
            {
                notification: 'ac418e17aa56422cbc0c7a8eabca5ed0', // RoomRelay - Repair assigned to you (src/fluent/generated/keys.ts)
                record: wfa.dataPill(params.trigger.current, 'reference'),
                table_name: DEFECT,
            }
        )
    }
)

// 2. Staff report a defect that nobody has triaged yet: tell the supervisors.
Flow(
    {
        $id: Now.ID['roomrelay-flow-new-defect'],
        name: 'RoomRelay - Notify supervisors of new defect',
        description: 'When a RoomRelay defect is reported with status New, email the RoomRelay Supervisors group.',
        runAs: 'system',
    },
    wfa.trigger(trigger.record.created, { $id: Now.ID['roomrelay-flow-new-defect-trigger'] }, { table: DEFECT, condition: 'status=new' }),
    (params) => {
        wfa.action(
            action.core.sendNotification,
            { $id: Now.ID['roomrelay-flow-new-defect-send'] },
            {
                notification: 'e90d805b09c74a44ab8524aeca1e55f4', // RoomRelay - New defect to triage (src/fluent/generated/keys.ts)
                record: wfa.dataPill(params.trigger.current, 'reference'),
                table_name: DEFECT,
            }
        )
    }
)

// 3. A supervisor fails an inspection: tell the room's housekeeper.
Flow(
    {
        $id: Now.ID['roomrelay-flow-inspection-failed'],
        name: 'RoomRelay - Notify housekeeper of failed inspection',
        description: "When a RoomRelay room's inspection changes to Failed, email the room's housekeeper.",
        runAs: 'system',
    },
    wfa.trigger(
        trigger.record.updated,
        { $id: Now.ID['roomrelay-flow-inspection-failed-trigger'] },
        { table: ROOM, condition: 'inspection=failed^inspectionVALCHANGES', trigger_strategy: 'unique_changes' }
    ),
    (params) => {
        wfa.action(
            action.core.sendNotification,
            { $id: Now.ID['roomrelay-flow-inspection-failed-send'] },
            {
                notification: '9aa42e0ecdfd4a9fa7ccd40a5384ba54', // RoomRelay - Inspection failed (src/fluent/generated/keys.ts)
                record: wfa.dataPill(params.trigger.current, 'reference'),
                table_name: ROOM,
            }
        )
    }
)
