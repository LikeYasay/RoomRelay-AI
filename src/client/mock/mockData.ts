import type {
    AuditEntry,
    Defect,
    HousekeepingTask,
    InspectionStatus,
    Room,
    Snapshot,
    Staff,
    TaskPriority,
    TaskStatus,
} from '../shared/domain/types.ts'
import { DEFECT_PRIORITY_META } from '../shared/domain/labels.ts'

/**
 * SYNTHETIC DEMO DATA, for the prototype only.
 * All people, rooms, defects and times are fictional. This is the single source for every
 * number the app shows, so KPIs, charts, tables and the audit log always agree.
 * Time is anchored to a fixed "now" so the dataset is deterministic.
 */

export const MOCK_NOW_MS = Date.UTC(2026, 10, 6, 14, 30)
const ago = (minutes: number): string => new Date(MOCK_NOW_MS - minutes * 60_000).toISOString()

export const STAFF: Staff[] = [
    { id: 'h1', name: 'Avery Collins', role: 'housekeeping', shift: 'morning' },
    { id: 'h2', name: 'Jordan Reyes', role: 'housekeeping', shift: 'morning' },
    { id: 'h3', name: 'Priya Nair', role: 'housekeeping', shift: 'afternoon' },
    { id: 'h4', name: 'Tomasz Kowalski', role: 'housekeeping', shift: 'afternoon' },
    { id: 'h5', name: 'Lena Okafor', role: 'housekeeping', shift: 'night' },
    { id: 'm1', name: 'Daniel Brooks', role: 'maintenance', shift: 'morning' },
    { id: 'm2', name: 'Sofia Marques', role: 'maintenance', shift: 'afternoon' },
    { id: 's1', name: 'Morgan Ellis', role: 'supervisor', shift: 'morning' },
    { id: 'a1', name: 'Riley Chen', role: 'admin', shift: 'morning' },
]

const SUPERVISOR_ID = 's1'
const ADMIN_ID = 'a1'

const ROOM_TYPES = [
    'Standard Queen',
    'Standard Queen',
    'Standard King',
    'Standard King',
    'Deluxe King',
    'Deluxe King',
    'Deluxe King',
    'Double Queen',
    'Junior Suite',
    'Executive Suite',
]

/**
 * One letter per room, floors 1 to 4, rooms 01 to 10 (so 305 is the 5th letter of floor 3).
 *   R ready                      N ready, with a Minor defect open     n ready, with a Normal defect open
 *   C not started                P 3 of 5 mandatory tasks done          p 1 of 5 done
 *   I cleaned, awaiting inspection
 *   B cleaning mostly done, a Blocking defect is open
 *   F cleaned, inspection failed
 *   X one task Couldn't Complete (supplies missing)
 *   M one task Couldn't Complete (needs maintenance), with the New defect it created
 */
const FLOOR_PLAN: Record<number, string> = {
    1: 'RCCFPRIRBR',
    2: 'RCXRRBIRCp',
    3: 'MRNRPFIRCR',
    4: 'CCRIPpBnCR',
}

const MANDATORY_TASKS: Array<{ title: string; description: string }> = [
    { title: 'Strip and remake bed', description: 'Replace all linens and inspect the mattress protector.' },
    { title: 'Clean and sanitize bathroom', description: 'Toilet, shower, sink and mirror; replace towels.' },
    { title: 'Vacuum and mop floors', description: 'Vacuum carpet and mop hard surfaces, including under the bed.' },
    { title: 'Dust surfaces and wipe fixtures', description: 'Dust all surfaces, wipe light switches and door handles.' },
    { title: 'Restock amenities and minibar check', description: 'Refill toiletries, coffee station and record minibar usage.' },
]

const BLOCKING_DEFECTS: Array<{ title: string; description: string }> = [
    { title: 'Air conditioning not cooling', description: 'Unit runs but room stays above 26 C.' },
    { title: 'Bathroom sink leaking', description: 'Water pooling under the vanity.' },
    { title: 'Door lock fault', description: 'Electronic lock intermittently fails to read key cards.' },
    { title: 'Ceiling water stain', description: 'Visible stain growing near the bathroom vent.' },
    { title: 'Window will not close', description: 'Latch is broken; room cannot be secured.' },
]

const C = 'completed' as const
const P = 'pending' as const
const X = 'couldnt_complete' as const

const STATUS_BY_KIND: Record<string, TaskStatus[]> = {
    R: [C, C, C, C, C],
    N: [C, C, C, C, C],
    n: [C, C, C, C, C],
    C: [P, P, P, P, P],
    P: [C, C, C, P, P],
    p: [C, P, P, P, P],
    I: [C, C, C, C, C],
    B: [C, C, C, C, P],
    F: [C, C, C, C, C],
    X: [C, C, C, P, X],
    M: [C, X, P, P, P],
}

const staffForPosition = (floor: number, position: number): string =>
    position >= 8 ? 'h5' : (['h1', 'h2', 'h3', 'h4'][floor - 1] as string)

const technicianForFloor = (floor: number): string => (floor % 2 === 1 ? 'm1' : 'm2')

function taskPriority(kind: string, n: number, index: number): TaskPriority {
    if (kind === 'B' || kind === 'F') return 'high'
    if (kind === 'M' && n === 1) return 'high'
    if (n === 1 && index % 3 === 0) return 'high'
    return 'normal'
}

function buildRoom(floor: number, position: number, kind: string): { room: Room; tasks: HousekeepingTask[]; defects: Defect[] } {
    const number = String(floor * 100 + position + 1)
    const index = (floor - 1) * 10 + position
    const assigneeId = staffForPosition(floor, position)
    const technicianId = technicianForFloor(floor)
    const statuses = STATUS_BY_KIND[kind] ?? STATUS_BY_KIND.C!

    // Minutes ago that cleaning started in this room. Later tasks finish more recently.
    const t0 = 200 + ((index * 29) % 200)

    const tasks: HousekeepingTask[] = MANDATORY_TASKS.map((def, n) => {
        const status = statuses[n] ?? P
        const task: HousekeepingTask = {
            id: `T-${number}-${n + 1}`,
            roomId: number,
            title: def.title,
            description: def.description,
            mandatory: true,
            priority: taskPriority(kind, n, index),
            status,
            assigneeId,
        }
        if (status === C) task.completedAt = ago(t0 - n * 20)
        return task
    })

    // One optional task on every fourth room.
    if (index % 4 === 0) {
        const done = kind === 'R' || kind === 'N' || kind === 'n'
        tasks.push({
            id: `T-${number}-6`,
            roomId: number,
            title: 'Rotate mattress',
            description: 'Quarterly mattress rotation (optional; never blocks readiness).',
            mandatory: false,
            priority: 'low',
            status: done ? C : P,
            assigneeId,
            completedAt: done ? ago(t0 - 90) : undefined,
        })
    }

    const defects: Defect[] = []

    if (kind === 'X') {
        const task = tasks[4]!
        task.incompleteReason = 'supplies_missing'
        task.incompleteNote = 'Coffee pods and shampoo are out of stock in the floor store room.'
        task.incompleteAt = ago(t0 - 60)
    }

    if (kind === 'M') {
        const task = tasks[1]!
        const defectId = `D-${number}-1`
        task.incompleteReason = 'needs_maintenance'
        task.incompleteNote = 'Shower head is leaking badly; cannot clean the bathroom until it is fixed.'
        task.incompleteAt = ago(t0 - 20)
        task.linkedDefectId = defectId
        defects.push({
            id: defectId,
            roomId: number,
            title: `Maintenance needed: ${task.title}`,
            description: task.incompleteNote,
            priority: 'normal',
            status: 'new',
            reportedById: assigneeId,
            reportedAt: task.incompleteAt,
            sourceTaskId: task.id,
        })
    }

    if (kind === 'B') {
        const def = BLOCKING_DEFECTS[index % BLOCKING_DEFECTS.length]!
        const inProgress = index % 2 === 0
        defects.push({
            id: `D-${number}-1`,
            roomId: number,
            title: def.title,
            description: def.description,
            priority: 'blocking',
            status: inProgress ? 'in_progress' : 'assigned',
            reportedById: inProgress ? assigneeId : SUPERVISOR_ID,
            reportedAt: ago(t0 - 30),
            technicianId,
            assignedById: SUPERVISOR_ID,
            assignedAt: ago(t0 - 45),
            startedAt: inProgress ? ago(t0 - 60) : undefined,
        })
    }

    if (kind === 'N' || kind === 'n') {
        const minor = kind === 'N'
        defects.push({
            id: `D-${number}-1`,
            roomId: number,
            title: minor ? 'Scuffed baseboard' : 'TV remote not working',
            description: minor
                ? 'Cosmetic scuff near the closet; does not affect guest use.'
                : 'Remote does not respond even with new batteries; the TV still works from its own buttons.',
            priority: minor ? 'minor' : 'normal',
            status: 'assigned',
            reportedById: assigneeId,
            reportedAt: ago(t0 + 100),
            technicianId,
            assignedById: SUPERVISOR_ID,
            assignedAt: ago(t0 + 80),
        })
    }

    // History: a few Ready rooms had a Blocking defect that is now resolved.
    if (kind === 'R' && index % 7 === 3) {
        defects.push({
            id: `D-${number}-1`,
            roomId: number,
            title: 'Shower drain slow',
            description: 'Drain backed up during morning check.',
            priority: 'blocking',
            status: 'resolved',
            reportedById: SUPERVISOR_ID,
            reportedAt: ago(t0 + 300),
            technicianId,
            assignedById: SUPERVISOR_ID,
            assignedAt: ago(t0 + 280),
            startedAt: ago(t0 + 240),
            resolvedAt: ago(t0 + 120),
            resolutionNotes: 'Drain cleared and tested.',
        })
    }

    const inspectionByKind: Record<string, InspectionStatus> = { R: 'passed', N: 'passed', n: 'passed', I: 'pending', F: 'failed' }
    const inspection: InspectionStatus = inspectionByKind[kind] ?? 'not_requested'
    const inspectionAt = inspection === 'not_requested' ? undefined : ago(t0 - (inspection === 'pending' ? 95 : 110))

    return {
        room: { id: number, floor, type: ROOM_TYPES[position] ?? 'Standard Queen', assigneeId, inspection, inspectionAt },
        tasks,
        defects,
    }
}

/** Audit history generated from the seed records, so the log and the data always agree. */
function seedAudit(rooms: Room[], tasks: HousekeepingTask[], defects: Defect[]): AuditEntry[] {
    const name = (id: string) => STAFF.find((s) => s.id === id)?.name ?? 'Unknown'
    const rows: Array<Omit<AuditEntry, 'id'>> = []

    for (const t of tasks) {
        if (t.status === 'completed' && t.completedAt) {
            rows.push({ at: t.completedAt, actorId: t.assigneeId, action: 'task_completed', roomId: t.roomId, targetId: t.id, summary: `${name(t.assigneeId)} completed "${t.title}".` })
        }
        if (t.status === 'couldnt_complete' && t.incompleteAt) {
            const reason = t.incompleteReason === 'needs_maintenance' ? 'Needs maintenance' : t.incompleteReason === 'supplies_missing' ? 'Supplies missing' : 'Other'
            rows.push({ at: t.incompleteAt, actorId: t.assigneeId, action: 'task_couldnt_complete', roomId: t.roomId, targetId: t.id, summary: `${name(t.assigneeId)} marked "${t.title}" Couldn't Complete (${reason}).` })
        }
    }

    for (const d of defects) {
        rows.push({ at: d.reportedAt, actorId: d.reportedById, action: 'defect_reported', roomId: d.roomId, targetId: d.id, summary: `${name(d.reportedById)} reported "${d.title}".` })
        if (d.assignedAt && d.technicianId && d.assignedById) {
            rows.push({
                at: d.assignedAt,
                actorId: d.assignedById,
                action: 'defect_assigned',
                roomId: d.roomId,
                targetId: d.id,
                summary: `${name(d.assignedById)} assigned "${d.title}" to ${name(d.technicianId)} with priority ${DEFECT_PRIORITY_META[d.priority].label}.`,
            })
        }
        if (d.startedAt && d.technicianId) {
            rows.push({ at: d.startedAt, actorId: d.technicianId, action: 'defect_started', roomId: d.roomId, targetId: d.id, summary: `${name(d.technicianId)} started work on "${d.title}".` })
        }
        if (d.resolvedAt && d.technicianId) {
            rows.push({ at: d.resolvedAt, actorId: d.technicianId, action: 'defect_resolved', roomId: d.roomId, targetId: d.id, summary: `${name(d.technicianId)} resolved "${d.title}".` })
        }
    }

    for (const r of rooms) {
        if (!r.inspectionAt) continue
        const requestedAt = r.inspection === 'pending' ? r.inspectionAt : new Date(Date.parse(r.inspectionAt) - 15 * 60_000).toISOString()
        rows.push({ at: requestedAt, actorId: r.assigneeId, action: 'inspection_requested', roomId: r.id, targetId: r.id, summary: `${name(r.assigneeId)} submitted Room ${r.id} for inspection.` })
        if (r.inspection === 'passed') {
            rows.push({ at: r.inspectionAt, actorId: SUPERVISOR_ID, action: 'inspection_passed', roomId: r.id, targetId: r.id, summary: `${name(SUPERVISOR_ID)} passed the inspection. Room ${r.id} is Ready.` })
        }
        if (r.inspection === 'failed') {
            rows.push({ at: r.inspectionAt, actorId: SUPERVISOR_ID, action: 'inspection_failed', roomId: r.id, targetId: r.id, summary: `${name(SUPERVISOR_ID)} failed the inspection of Room ${r.id}.` })
        }
    }

    rows.push(
        { at: ago(600), actorId: SUPERVISOR_ID, action: 'briefing_generated', summary: `${name(SUPERVISOR_ID)} generated the Night shift briefing (simulated, not AI).` },
        { at: ago(2900), actorId: ADMIN_ID, action: 'access_request_approved', targetId: 'req-0', summary: `${name(ADMIN_ID)} approved the access request from Sam Patel (Housekeeping Staff).` },
        { at: ago(4300), actorId: ADMIN_ID, action: 'access_request_declined', targetId: 'req-00', summary: `${name(ADMIN_ID)} declined an access request for an administrator account (administrator accounts are created by IT only).` }
    )

    return rows
        .sort((a, b) => a.at.localeCompare(b.at))
        .map((row, i) => ({ id: `A-${String(i + 1).padStart(4, '0')}`, ...row }))
}

export function buildMockSnapshot(): Snapshot {
    const rooms: Room[] = []
    const tasks: HousekeepingTask[] = []
    const defects: Defect[] = []

    for (const [floorKey, plan] of Object.entries(FLOOR_PLAN)) {
        const floor = Number(floorKey)
        plan.split('').forEach((kind, position) => {
            const built = buildRoom(floor, position, kind)
            rooms.push(built.room)
            tasks.push(...built.tasks)
            defects.push(...built.defects)
        })
    }

    return { rooms, tasks, defects, staff: STAFF, audit: seedAudit(rooms, tasks, defects), generatedAt: ago(0), source: 'mock' }
}
