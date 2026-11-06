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
