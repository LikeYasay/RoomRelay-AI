import type {
    Defect,
    HousekeepingTask,
    InspectionStatus,
    Priority,
    Room,
    Severity,
    Snapshot,
    Staff,
} from '../types/domain'

/**
 * SYNTHETIC DEMO DATA, for the Phase 1 prototype only.
 * All people, rooms, defects and times are fictional. This is the single source
 * for every number the dashboard shows, so KPIs, charts and tables always agree.
 * Time is anchored to a fixed "now" so the dataset is deterministic.
 */

const MOCK_NOW_MS = Date.UTC(2026, 10, 6, 14, 30)
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
 *   R ready, N ready with a minor non-blocking defect, C not started,
 *   P 3 of 5 mandatory tasks done, p 1 of 5 done, I cleaned and awaiting inspection,
 *   B cleaning mostly done but a blocking defect is open, F inspection failed.
 */
const FLOOR_PLAN: Record<number, string> = {
    1: 'RCCFPRIRBR',
    2: 'RCPRRBIRCp',
    3: 'CRNRPFIRCR',
    4: 'CCRIPpBRCR',
}

const MANDATORY_TASKS: Array<{ title: string; description: string }> = [
    { title: 'Strip and remake bed', description: 'Replace all linens and inspect the mattress protector.' },
    { title: 'Clean and sanitize bathroom', description: 'Toilet, shower, sink and mirror; replace towels.' },
    { title: 'Vacuum and mop floors', description: 'Vacuum carpet and mop hard surfaces, including under the bed.' },
    { title: 'Dust surfaces and wipe fixtures', description: 'Dust all surfaces, wipe light switches and door handles.' },
    { title: 'Restock amenities and minibar check', description: 'Refill toiletries, coffee station and record minibar usage.' },
]

const BLOCKING_DEFECTS: Array<{ title: string; description: string; severity: Severity }> = [
    { title: 'Air conditioning not cooling', description: 'Unit runs but room stays above 26 C.', severity: 'high' },
    { title: 'Bathroom sink leaking', description: 'Water pooling under the vanity.', severity: 'critical' },
    { title: 'Door lock fault', description: 'Electronic lock intermittently fails to read key cards.', severity: 'critical' },
    { title: 'Ceiling water stain', description: 'Visible stain growing near the bathroom vent.', severity: 'high' },
    { title: 'Window will not close', description: 'Latch is broken; room cannot be secured.', severity: 'medium' },
]

const staffForPosition = (floor: number, position: number): string =>
    position >= 8 ? 'h5' : (['h1', 'h2', 'h3', 'h4'][floor - 1] as string)

const technicianForFloor = (floor: number): string => (floor % 2 === 1 ? 'm1' : 'm2')

function buildRoom(floor: number, position: number, kind: string): {
    room: Room
    tasks: HousekeepingTask[]
    defects: Defect[]
} {
    const number = String(floor * 100 + position + 1)
    const index = (floor - 1) * 10 + position
    const assigneeId = staffForPosition(floor, position)

    // Mandatory-task status pattern, by scenario.
    const statusByKind: Record<string, Array<'done' | 'in_progress' | 'todo'>> = {
        R: ['done', 'done', 'done', 'done', 'done'],
        N: ['done', 'done', 'done', 'done', 'done'],
        C: ['todo', 'todo', 'todo', 'todo', 'todo'],
        P: ['done', 'done', 'done', 'in_progress', 'todo'],
        p: ['done', 'in_progress', 'todo', 'todo', 'todo'],
        I: ['done', 'done', 'done', 'done', 'done'],
        B: ['done', 'done', 'done', 'done', 'todo'],
        F: ['done', 'done', 'done', 'done', 'done'],
    }
    const statuses = statusByKind[kind] ?? statusByKind.C!

    const tasks: HousekeepingTask[] = MANDATORY_TASKS.map((def, n) => {
        const status = statuses[n] ?? 'todo'
        const priority: Priority = kind === 'B' || kind === 'F' ? 'high' : 'normal'
        return {
            id: `T-${number}-${n + 1}`,
            roomId: number,
            title: def.title,
            description: def.description,
            mandatory: true,
            priority,
            status,
            assigneeId,
            supervisorReview: status === 'done' ? (kind === 'R' || kind === 'N' ? 'approved' : 'pending') : 'not_required',
            completedAt: status === 'done' ? ago(40 + ((index * 17 + n * 13) % 280)) : undefined,
        }
    })

    // One optional task on every fourth room.
    if (index % 4 === 0) {
        const done = kind === 'R' || kind === 'N'
        tasks.push({
            id: `T-${number}-6`,
            roomId: number,
            title: 'Rotate mattress',
            description: 'Quarterly mattress rotation (optional; never blocks readiness).',
            mandatory: false,
            priority: 'low',
            status: done ? 'done' : 'todo',
            assigneeId,
            supervisorReview: 'not_required',
            completedAt: done ? ago(60 + ((index * 11) % 200)) : undefined,
        })
    }

    const defects: Defect[] = []
    const technicianId = technicianForFloor(floor)

    if (kind === 'B') {
        const def = BLOCKING_DEFECTS[index % BLOCKING_DEFECTS.length]!
        const inProgress = index % 2 === 0
        defects.push({
            id: `D-${number}-1`,
            roomId: number,
            title: def.title,
            description: def.description,
            severity: def.severity,
            blocking: true,
            status: inProgress ? 'in_progress' : 'open',
            technicianId: inProgress ? technicianId : undefined,
            reportedAt: ago(90 + ((index * 23) % 240)),
        })
    }

    if (kind === 'N') {
        defects.push({
            id: `D-${number}-1`,
            roomId: number,
            title: 'Scuffed baseboard',
            description: 'Cosmetic scuff near the closet; does not affect guest use.',
            severity: 'low',
            blocking: false,
            status: 'open',
            technicianId,
            reportedAt: ago(500 + index * 7),
        })
    }

    // History: a few Ready rooms had a blocking defect that is now resolved.
    if (kind === 'R' && index % 7 === 3) {
        defects.push({
            id: `D-${number}-1`,
            roomId: number,
            title: 'Shower drain slow',
            description: 'Drain backed up during morning check.',
            severity: 'medium',
            blocking: true,
            status: 'resolved',
            technicianId,
            reportedAt: ago(700),
            resolvedAt: ago(180 + index),
            resolutionNotes: 'Drain cleared and tested.',
        })
    }

    const inspectionByKind: Record<string, InspectionStatus> = {
        R: 'passed',
        N: 'passed',
        I: 'pending',
        F: 'failed',
    }
    const inspection: InspectionStatus = inspectionByKind[kind] ?? 'not_requested'

    return {
        room: {
            id: number,
            floor,
            type: ROOM_TYPES[position] ?? 'Standard Queen',
            assigneeId,
            inspection,
            inspectionAt: inspection === 'not_requested' ? undefined : ago(20 + ((index * 19) % 160)),
        },
        tasks,
        defects,
    }
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

    return { rooms, tasks, defects, staff: STAFF, generatedAt: ago(0), source: 'mock' }
}
