import type { DefectPriority, IncompleteReason, InspectionStatus, Shift } from '../domain/types'

/**
 * Every change a user can make, as one typed list. This is the WRITE contract the backend
 * must provide (one REST call per command). Each feature folder holds the rules for its own
 * commands, for example features/maintenance/defectCommands.ts.
 *
 * Commands never carry the actor or their role: the server knows who is calling from the
 * session and must re-check every rule itself.
 */
export type Command =
    | { type: 'task.complete'; taskId: string }
    | { type: 'task.couldntComplete'; taskId: string; reason: IncompleteReason; note?: string }
    | { type: 'task.reopen'; taskId: string }
    | { type: 'defect.report'; roomId: string; title: string; description: string; priority?: DefectPriority; technicianId?: string }
    | { type: 'defect.triage'; defectId: string; technicianId: string; priority: DefectPriority }
    | { type: 'defect.start'; defectId: string }
    | { type: 'defect.resolve'; defectId: string; notes: string }
    | { type: 'room.submitInspection'; roomId: string }
    | { type: 'room.recordInspection'; roomId: string; result: Extract<InspectionStatus, 'passed' | 'failed'> }
    | { type: 'handoff.briefingGenerated'; shift: Shift }

export type CommandFailureKind = 'forbidden' | 'not_found' | 'invalid' | 'conflict'

/** Messages are written by our own rules and are safe to show. Server text must be mapped, never shown raw. */
export type CommandOutcome = { ok: true } | { ok: false; kind: CommandFailureKind; message: string; fieldErrors?: Record<string, string> }

const INCOMPLETE_REASONS: readonly IncompleteReason[] = ['supplies_missing', 'needs_maintenance', 'other']
const DEFECT_PRIORITIES: readonly DefectPriority[] = ['blocking', 'normal', 'minor']
const SHIFTS: readonly Shift[] = ['morning', 'afternoon', 'night']

/** The fields each command may carry. Anything else makes the request invalid. */
const ALLOWED_FIELDS: Record<Command['type'], readonly string[]> = {
    'task.complete': ['taskId'],
    'task.couldntComplete': ['taskId', 'reason', 'note'],
    'task.reopen': ['taskId'],
    'defect.report': ['roomId', 'title', 'description', 'priority', 'technicianId'],
    'defect.triage': ['defectId', 'technicianId', 'priority'],
    'defect.start': ['defectId'],
    'defect.resolve': ['defectId', 'notes'],
    'room.submitInspection': ['roomId'],
    'room.recordInspection': ['roomId', 'result'],
    'handoff.briefingGenerated': ['shift'],
}

function text(value: unknown, max: number): string | undefined {
    return typeof value === 'string' && value.length <= max ? value : undefined
}

function oneOf<T extends string>(value: unknown, options: readonly T[]): T | undefined {
    return typeof value === 'string' && (options as readonly string[]).includes(value) ? (value as T) : undefined
}

/**
 * Turns untrusted JSON (a request body) into a Command, or null if it is not a well-formed one:
 * unknown type, unknown field, wrong type or an over-long value. Content rules (lengths, who may
 * do what) are checked afterwards by the feature's rule function.
 */
export function parseCommand(raw: unknown): Command | null {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
    const o = raw as Record<string, unknown>
    const type = o.type
    if (typeof type !== 'string' || !Object.prototype.hasOwnProperty.call(ALLOWED_FIELDS, type)) return null
    const allowed = ALLOWED_FIELDS[type as Command['type']]
    if (Object.keys(o).some((k) => k !== 'type' && !allowed.includes(k))) return null

    const id = (v: unknown) => text(v, 40)
    switch (type as Command['type']) {
        case 'task.complete':
        case 'task.reopen': {
            const taskId = id(o.taskId)
            return taskId ? { type: type as 'task.complete' | 'task.reopen', taskId } : null
        }
        case 'task.couldntComplete': {
            const taskId = id(o.taskId)
            const reason = oneOf(o.reason, INCOMPLETE_REASONS)
            const note = o.note === undefined ? undefined : text(o.note, 2000)
            if (!taskId || !reason || (o.note !== undefined && note === undefined)) return null
            return { type: 'task.couldntComplete', taskId, reason, note }
        }
        case 'defect.report': {
            const roomId = id(o.roomId)
            const title = text(o.title, 2000)
            const description = text(o.description, 5000)
            const priority = o.priority === undefined ? undefined : oneOf(o.priority, DEFECT_PRIORITIES)
            const technicianId = o.technicianId === undefined ? undefined : id(o.technicianId)
            if (roomId === undefined || title === undefined || description === undefined) return null
            if ((o.priority !== undefined && !priority) || (o.technicianId !== undefined && !technicianId)) return null
            return { type: 'defect.report', roomId, title, description, priority, technicianId }
        }
        case 'defect.triage': {
            const defectId = id(o.defectId)
            const technicianId = id(o.technicianId)
            const priority = oneOf(o.priority, DEFECT_PRIORITIES)
            return defectId && technicianId !== undefined && priority ? { type: 'defect.triage', defectId, technicianId, priority } : null
        }
        case 'defect.start': {
            const defectId = id(o.defectId)
            return defectId ? { type: 'defect.start', defectId } : null
        }
        case 'defect.resolve': {
            const defectId = id(o.defectId)
            const notes = text(o.notes, 5000)
            return defectId && notes !== undefined ? { type: 'defect.resolve', defectId, notes } : null
        }
        case 'room.submitInspection': {
            const roomId = id(o.roomId)
            return roomId ? { type: 'room.submitInspection', roomId } : null
        }
        case 'room.recordInspection': {
            const roomId = id(o.roomId)
            const result = oneOf(o.result, ['passed', 'failed'] as const)
            return roomId && result ? { type: 'room.recordInspection', roomId, result } : null
        }
        case 'handoff.briefingGenerated': {
            const shift = oneOf(o.shift, SHIFTS)
            return shift ? { type: 'handoff.briefingGenerated', shift } : null
        }
    }
}
