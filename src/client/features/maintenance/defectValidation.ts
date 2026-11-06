import { DEFECT_PRIORITY_ORDER } from '../../shared/domain/labels.ts'
import type { DefectPriority } from '../../shared/domain/types.ts'
import { checkText } from '../../shared/lib/validation.ts'
import type { FieldErrors, ValidationResult } from '../../shared/lib/validation.ts'

/**
 * Defect report, triage and resolution form rules.
 *
 * The server applies the same checks (through the command rules) before saving anything.
 */

export const LIMITS = {
    defectTitleMin: 3,
    defectTitleMax: 100,
    defectDescriptionMin: 10,
    defectDescriptionMax: 1000,
    resolutionMin: 5,
    resolutionMax: 500,
} as const

export const DEFECT_PRIORITIES: DefectPriority[] = DEFECT_PRIORITY_ORDER

function isDefectPriority(value: string): value is DefectPriority {
    return (DEFECT_PRIORITIES as string[]).includes(value)
}

export interface DefectReportInput {
    roomId: string
    title: string
    description: string
    /** Supervisors only. Empty or missing means Normal. */
    priority?: string
    /** Supervisors only. Empty or missing means "not assigned yet". */
    technicianId?: string
}

export interface DefectReportValue {
    roomId: string
    title: string
    description: string
    priority: DefectPriority
    technicianId: string | undefined
}

type ReportField = 'roomId' | 'title' | 'description' | 'priority' | 'technicianId'

export interface ReportOptions {
    /** Rooms this user may report against (resource-identifier check). */
    allowedRoomIds: string[]
    /** Maintenance staff who may be assigned. */
    technicianIds: string[]
}

export function validateDefectReport(input: DefectReportInput, options: ReportOptions): ValidationResult<DefectReportValue, ReportField> {
    const errors: FieldErrors<ReportField> = {}

    if (input.roomId === '') errors.roomId = 'Choose a room.'
    else if (!options.allowedRoomIds.includes(input.roomId)) errors.roomId = 'Choose a room from the list.'

    const titleError = checkText('Problem title', input.title, LIMITS.defectTitleMin, LIMITS.defectTitleMax, true)
    if (titleError) errors.title = titleError

    const descError = checkText('Description', input.description, LIMITS.defectDescriptionMin, LIMITS.defectDescriptionMax, false)
    if (descError) errors.description = descError

    const rawPriority = input.priority ?? ''
    const priority: DefectPriority | undefined = rawPriority === '' ? 'normal' : isDefectPriority(rawPriority) ? rawPriority : undefined
    if (!priority) errors.priority = 'Choose a priority.'

    const rawTech = input.technicianId ?? ''
    if (rawTech !== '' && !options.technicianIds.includes(rawTech)) errors.technicianId = 'Choose a technician from the list.'

    if (Object.keys(errors).length > 0 || !priority) return { ok: false, errors }

    return {
        ok: true,
        errors: {},
        value: {
            roomId: input.roomId,
            title: input.title.trim(),
            description: input.description.trim(),
            priority,
            technicianId: rawTech === '' ? undefined : rawTech,
        },
    }
}

export interface TriageValue {
    technicianId: string
    priority: DefectPriority
}

/** Supervisor triage: a technician and a priority are both required. */
export function validateTriage(
    input: { technicianId: string; priority: string },
    technicianIds: string[]
): ValidationResult<TriageValue, 'technicianId' | 'priority'> {
    const errors: FieldErrors<'technicianId' | 'priority'> = {}
    if (input.technicianId === '') errors.technicianId = 'Choose a technician.'
    else if (!technicianIds.includes(input.technicianId)) errors.technicianId = 'Choose a technician from the list.'
    const priority = isDefectPriority(input.priority) ? input.priority : undefined
    if (!priority) errors.priority = 'Choose a priority.'
    if (Object.keys(errors).length > 0 || !priority) return { ok: false, errors }
    return { ok: true, errors: {}, value: { technicianId: input.technicianId, priority } }
}

export function validateResolution(notes: string): ValidationResult<{ notes: string }, 'notes'> {
    const error = checkText('A resolution note', notes, LIMITS.resolutionMin, LIMITS.resolutionMax, false)
    if (error) return { ok: false, errors: { notes: error } }
    return { ok: true, errors: {}, value: { notes: notes.trim() } }
}
