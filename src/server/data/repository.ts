import { GlideRecord } from '@servicenow/glide'
import type {
    AuditEntry,
    Defect,
    DefectPriority,
    DefectStatus,
    HousekeepingTask,
    IncompleteReason,
    InspectionStatus,
    Room,
    Snapshot,
    Staff,
    TaskPriority,
    TaskStatus,
} from '../../client/shared/domain/types'
import { TABLES } from '../shared/tables'
import { fromGlide, nowIso, toGlide } from '../shared/time'

/**
 * Reads the RoomRelay tables into the app's Snapshot shape, and writes back what a rule changed.
 * The app identifies rooms by number and tasks/defects by code (T-305-1, D-305-1); people by
 * sys_user sys_id. References between tables are stored as sys_ids and translated here.
 *
 * Plain GlideRecord is used on purpose: these tables are closed to direct access (ACLs), and the
 * REST handlers decide who may see or change what, using the shared rule functions.
 */

/** sys_ids of the loaded records, so changes can be written back without searching again. */
export interface RecordIds {
    room: Map<string, string> // room number -> sys_id
    task: Map<string, string> // task code -> sys_id
    defect: Map<string, string> // defect code -> sys_id
}

const value = (gr: GlideRecord, field: string): string | undefined => gr.getValue(field) || undefined

function invert(map: Map<string, string>): Map<string, string> {
    return new Map([...map.entries()].map(([k, v]) => [v, k]))
}

/** Loads everything. Audit entries are optional because the command rules only append to them. */
export function loadSnapshot(staff: Staff[], options: { withAudit: boolean }): { snapshot: Snapshot; ids: RecordIds } {
    const ids: RecordIds = { room: new Map(), task: new Map(), defect: new Map() }

    const rooms: Room[] = []
    const roomGr = new GlideRecord(TABLES.room)
    roomGr.orderBy('number')
    roomGr.query()
    while (roomGr.next()) {
        const id = roomGr.getValue('number')
        ids.room.set(id, roomGr.getUniqueValue())
        rooms.push({
            id,
            floor: Number(roomGr.getValue('floor')),
            type: value(roomGr, 'room_type') ?? '',
            assigneeId: value(roomGr, 'assigned_to') ?? '',
            inspection: (value(roomGr, 'inspection') ?? 'not_requested') as InspectionStatus,
            inspectionAt: fromGlide(value(roomGr, 'inspection_at')),
        })
    }
    const roomNumber = invert(ids.room)

    // Tasks and defects reference each other, so read both before translating references.
    const taskRows: Array<{ sysId: string; task: HousekeepingTask; linkedDefectSysId?: string }> = []
    const taskGr = new GlideRecord(TABLES.task)
    taskGr.orderBy('code')
    taskGr.query()
    while (taskGr.next()) {
        const code = taskGr.getValue('code')
        ids.task.set(code, taskGr.getUniqueValue())
        taskRows.push({
            sysId: taskGr.getUniqueValue(),
            linkedDefectSysId: value(taskGr, 'linked_defect'),
            task: {
                id: code,
                roomId: roomNumber.get(taskGr.getValue('room')) ?? '',
                title: taskGr.getValue('title'),
                description: value(taskGr, 'description') ?? '',
                mandatory: taskGr.getValue('mandatory') === '1' || taskGr.getValue('mandatory') === 'true',
                priority: (value(taskGr, 'priority') ?? 'normal') as TaskPriority,
                status: (value(taskGr, 'status') ?? 'pending') as TaskStatus,
                assigneeId: value(taskGr, 'assigned_to') ?? '',
                completedAt: fromGlide(value(taskGr, 'completed_at')),
                incompleteReason: value(taskGr, 'incomplete_reason') as IncompleteReason | undefined,
                incompleteNote: value(taskGr, 'incomplete_note'),
                incompleteAt: fromGlide(value(taskGr, 'incomplete_at')),
                repairNote: value(taskGr, 'repair_note'),
            },
        })
    }

    const defectRows: Array<{ defect: Defect; sourceTaskSysId?: string }> = []
    const defectGr = new GlideRecord(TABLES.defect)
    defectGr.orderBy('code')
    defectGr.query()
    while (defectGr.next()) {
        const code = defectGr.getValue('code')
        ids.defect.set(code, defectGr.getUniqueValue())
        defectRows.push({
            sourceTaskSysId: value(defectGr, 'source_task'),
            defect: {
                id: code,
                roomId: roomNumber.get(defectGr.getValue('room')) ?? '',
                title: defectGr.getValue('title'),
                description: value(defectGr, 'description') ?? '',
                priority: (value(defectGr, 'priority') ?? 'normal') as DefectPriority,
                status: (value(defectGr, 'status') ?? 'new') as DefectStatus,
                reportedById: value(defectGr, 'reported_by') ?? '',
                reportedAt: fromGlide(value(defectGr, 'reported_at')) ?? fromGlide(value(defectGr, 'sys_created_on')) ?? nowIso(),
                technicianId: value(defectGr, 'technician'),
                assignedById: value(defectGr, 'assigned_by'),
                assignedAt: fromGlide(value(defectGr, 'assigned_at')),
                startedAt: fromGlide(value(defectGr, 'started_at')),
                resolvedAt: fromGlide(value(defectGr, 'resolved_at')),
                resolutionNotes: value(defectGr, 'resolution_notes'),
            },
        })
    }

    const taskCode = invert(ids.task)
    const defectCode = invert(ids.defect)
    const tasks = taskRows.map(({ task, linkedDefectSysId }) => ({ ...task, linkedDefectId: linkedDefectSysId ? defectCode.get(linkedDefectSysId) : undefined }))
    const defects = defectRows.map(({ defect, sourceTaskSysId }) => ({ ...defect, sourceTaskId: sourceTaskSysId ? taskCode.get(sourceTaskSysId) : undefined }))

    const audit: AuditEntry[] = []
    if (options.withAudit) {
        const auditGr = new GlideRecord(TABLES.audit)
        auditGr.orderBy('at')
        auditGr.query()
        while (auditGr.next()) {
            audit.push({
                id: auditGr.getUniqueValue(),
                at: fromGlide(auditGr.getValue('at')) as string,
                actorId: auditGr.getValue('actor'),
                action: auditGr.getValue('action') as AuditEntry['action'],
                roomId: roomNumber.get(value(auditGr, 'room') ?? ''),
                targetId: value(auditGr, 'target'),
                summary: value(auditGr, 'summary') ?? '',
            })
        }
    }

    return { snapshot: { rooms, tasks, defects, staff, audit, generatedAt: nowIso(), source: 'servicenow' }, ids }
}

// ---------------------------------------------------------------- writing

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function setDate(gr: GlideRecord, field: string, iso: string | undefined): void {
    gr.setValue(field, toGlide(iso))
}

function writeRoom(gr: GlideRecord, room: Room): void {
    gr.setValue('inspection', room.inspection)
    setDate(gr, 'inspection_at', room.inspectionAt)
}

function writeTask(gr: GlideRecord, task: HousekeepingTask, ids: RecordIds): void {
    gr.setValue('status', task.status)
    setDate(gr, 'completed_at', task.completedAt)
    gr.setValue('incomplete_reason', task.incompleteReason ?? '')
    gr.setValue('incomplete_note', task.incompleteNote ?? '')
    setDate(gr, 'incomplete_at', task.incompleteAt)
    gr.setValue('linked_defect', task.linkedDefectId ? (ids.defect.get(task.linkedDefectId) ?? '') : '')
    gr.setValue('repair_note', task.repairNote ?? '')
}

function writeDefect(gr: GlideRecord, defect: Defect, ids: RecordIds): void {
    gr.setValue('code', defect.id)
    gr.setValue('room', ids.room.get(defect.roomId) ?? '')
    gr.setValue('title', defect.title)
    gr.setValue('description', defect.description)
    gr.setValue('priority', defect.priority)
    gr.setValue('status', defect.status)
    gr.setValue('reported_by', defect.reportedById)
    setDate(gr, 'reported_at', defect.reportedAt)
    gr.setValue('technician', defect.technicianId ?? '')
    gr.setValue('assigned_by', defect.assignedById ?? '')
    setDate(gr, 'assigned_at', defect.assignedAt)
    setDate(gr, 'started_at', defect.startedAt)
    setDate(gr, 'resolved_at', defect.resolvedAt)
    gr.setValue('resolution_notes', defect.resolutionNotes ?? '')
    gr.setValue('source_task', defect.sourceTaskId ? (ids.task.get(defect.sourceTaskId) ?? '') : '')
}

function update(table: string, sysId: string | undefined, write: (gr: GlideRecord) => void): void {
    if (!sysId) return
    const gr = new GlideRecord(table)
    if (!gr.get(sysId)) return
    write(gr)
    gr.update()
}

/**
 * Writes the difference between two snapshots: changed rooms and tasks, new or changed defects,
 * and every new audit entry. New defects are inserted first so tasks can reference them.
 */
export function saveChanges(before: Snapshot, after: Snapshot, ids: RecordIds): void {
    const beforeRooms = new Map(before.rooms.map((r) => [r.id, r]))
    const beforeTasks = new Map(before.tasks.map((t) => [t.id, t]))
    const beforeDefects = new Map(before.defects.map((d) => [d.id, d]))

    for (const defect of after.defects) {
        const previous = beforeDefects.get(defect.id)
        if (previous && same(previous, defect)) continue
        if (previous) {
            update(TABLES.defect, ids.defect.get(defect.id), (gr) => writeDefect(gr, defect, ids))
        } else {
            const gr = new GlideRecord(TABLES.defect)
            gr.initialize()
            writeDefect(gr, defect, ids)
            const sysId = gr.insert()
            if (sysId) ids.defect.set(defect.id, sysId)
        }
    }

    for (const room of after.rooms) {
        const previous = beforeRooms.get(room.id)
        if (previous && !same(previous, room)) update(TABLES.room, ids.room.get(room.id), (gr) => writeRoom(gr, room))
    }

    for (const task of after.tasks) {
        const previous = beforeTasks.get(task.id)
        if (previous && !same(previous, task)) update(TABLES.task, ids.task.get(task.id), (gr) => writeTask(gr, task, ids))
    }

    // Rules only ever append audit entries, so the new ones are at the end.
    for (const entry of after.audit.slice(before.audit.length)) insertAudit(entry, ids)
}

export function insertAudit(entry: AuditEntry, ids: RecordIds): void {
    const gr = new GlideRecord(TABLES.audit)
    gr.initialize()
    setDate(gr, 'at', entry.at)
    gr.setValue('actor', entry.actorId)
    gr.setValue('action', entry.action)
    gr.setValue('room', entry.roomId ? (ids.room.get(entry.roomId) ?? '') : '')
    gr.setValue('target', entry.targetId ?? '')
    gr.setValue('summary', entry.summary.slice(0, 300))
    gr.insert()
}
