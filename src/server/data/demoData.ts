import { GlideRecord } from '@servicenow/glide'
import { buildMockSnapshot, MOCK_NOW_MS } from '../../client/mock/mockData.ts'
import { TABLES } from '../shared/tables.ts'
import { toGlide } from '../shared/time.ts'
import { insertAudit } from './repository.ts'
import type { RecordIds } from './repository.ts'

/**
 * Restores the initial data set: replaces all RoomRelay rooms, tasks, defects and audit entries
 * with the data the local preview uses (src/client/mock/mockData.ts). People are matched to the
 * installed staff accounts through the staff profile's key (h1, s1, ...). Times are shifted so the
 * data looks recent. Only the RoomRelay administrator can run it (see api/handlers.ts).
 *
 * Records are written with setWorkflow(false) so loading the data does not start the RoomRelay
 * flows (no emails about defects and inspections that are only part of the starting data).
 */
export function resetDemoData(nowIso: string): { ok: true } | { ok: false; message: string } {
    // Staff key (h1, m1, s1...) -> sys_user sys_id, from the staff profiles installed with the app.
    const userByKey = new Map<string, string>()
    const profiles = new GlideRecord(TABLES.staff)
    profiles.addNotNullQuery('demo_key')
    profiles.query()
    while (profiles.next()) userByKey.set(profiles.getValue('demo_key'), profiles.getValue('user'))

    const seed = buildMockSnapshot()
    const missing = seed.staff.filter((s) => !userByKey.has(s.id))
    if (missing.length > 0) return { ok: false, message: `Some staff accounts installed with the app are missing (${missing.map((s) => s.name).join(', ')}).` }

    const user = (key: string | undefined) => (key ? (userByKey.get(key) ?? '') : '')
    const offsetMs = Date.parse(nowIso) - MOCK_NOW_MS
    const shift = (iso: string | undefined) => (iso ? toGlide(new Date(Date.parse(iso) + offsetMs).toISOString()) : '')

    // Clear the old data (children first).
    for (const table of [TABLES.audit, TABLES.task, TABLES.defect, TABLES.room]) {
        const gr = new GlideRecord(table)
        gr.query()
        gr.deleteMultiple()
    }

    const ids: RecordIds = { room: new Map(), task: new Map(), defect: new Map() }

    for (const room of seed.rooms) {
        const gr = new GlideRecord(TABLES.room)
        gr.initialize()
        gr.setWorkflow(false) // initial data: no flows or emails
        gr.setValue('number', room.id)
        gr.setValue('floor', room.floor)
        gr.setValue('room_type', room.type)
        gr.setValue('assigned_to', user(room.assigneeId))
        gr.setValue('inspection', room.inspection)
        gr.setValue('inspection_at', shift(room.inspectionAt))
        ids.room.set(room.id, gr.insert() ?? '')
    }

    // Defects before tasks (tasks point at defects); the defect -> task link is filled in afterwards.
    for (const d of seed.defects) {
        const gr = new GlideRecord(TABLES.defect)
        gr.initialize()
        gr.setWorkflow(false) // initial data: no flows or emails
        gr.setValue('code', d.id)
        gr.setValue('room', ids.room.get(d.roomId) ?? '')
        gr.setValue('title', d.title)
        gr.setValue('description', d.description)
        gr.setValue('priority', d.priority)
        gr.setValue('status', d.status)
        gr.setValue('reported_by', user(d.reportedById))
        gr.setValue('reported_at', shift(d.reportedAt))
        gr.setValue('technician', user(d.technicianId))
        gr.setValue('assigned_by', user(d.assignedById))
        gr.setValue('assigned_at', shift(d.assignedAt))
        gr.setValue('started_at', shift(d.startedAt))
        gr.setValue('resolved_at', shift(d.resolvedAt))
        gr.setValue('resolution_notes', d.resolutionNotes ?? '')
        ids.defect.set(d.id, gr.insert() ?? '')
    }

    for (const t of seed.tasks) {
        const gr = new GlideRecord(TABLES.task)
        gr.initialize()
        gr.setWorkflow(false) // initial data: no flows or emails
        gr.setValue('code', t.id)
        gr.setValue('room', ids.room.get(t.roomId) ?? '')
        gr.setValue('title', t.title)
        gr.setValue('description', t.description)
        gr.setValue('mandatory', t.mandatory)
        gr.setValue('priority', t.priority)
        gr.setValue('status', t.status)
        gr.setValue('assigned_to', user(t.assigneeId))
        gr.setValue('completed_at', shift(t.completedAt))
        gr.setValue('incomplete_reason', t.incompleteReason ?? '')
        gr.setValue('incomplete_note', t.incompleteNote ?? '')
        gr.setValue('incomplete_at', shift(t.incompleteAt))
        gr.setValue('linked_defect', t.linkedDefectId ? (ids.defect.get(t.linkedDefectId) ?? '') : '')
        gr.setValue('repair_note', t.repairNote ?? '')
        ids.task.set(t.id, gr.insert() ?? '')
    }

    for (const d of seed.defects.filter((x) => x.sourceTaskId)) {
        const gr = new GlideRecord(TABLES.defect)
        if (gr.get(ids.defect.get(d.id) ?? '')) {
            gr.setValue('source_task', ids.task.get(d.sourceTaskId ?? '') ?? '')
            gr.setWorkflow(false)
            gr.update()
        }
    }

    for (const entry of seed.audit) {
        insertAudit({ ...entry, actorId: user(entry.actorId), at: new Date(Date.parse(entry.at) + offsetMs).toISOString() }, ids)
    }

    return { ok: true }
}
