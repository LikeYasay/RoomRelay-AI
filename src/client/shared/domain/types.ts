/**
 * Domain types for RoomRelay AI: the shapes the backend must return.
 *
 * The ServiceNow server builds these shapes from its tables (src/server/data/repository.ts);
 * the local preview builds them from the initial data set (src/client/mock). Authorization is
 * enforced by the server (roles, ACLs, the rule functions), never by the browser.
 * See docs/GLOSSARY.md for what every term means.
 */

export type Role = 'housekeeping' | 'maintenance' | 'supervisor' | 'admin'
export type Shift = 'morning' | 'afternoon' | 'night'

/** Final, derived room status. Nobody sets it by hand. Cleaning progress is NOT the same as Ready. */
export type RoomStatus = 'needs_cleaning' | 'in_progress' | 'pending_inspection' | 'blocked' | 'ready'
export type InspectionStatus = 'not_requested' | 'pending' | 'passed' | 'failed'

/** Housekeeping task state. "Couldn't Complete" never counts as done. */
export type TaskStatus = 'pending' | 'completed' | 'couldnt_complete'
/** Only controls the order tasks (and rooms) are shown in. It never affects readiness. */
export type TaskPriority = 'high' | 'normal' | 'low'
export type IncompleteReason = 'supplies_missing' | 'needs_maintenance' | 'other'

/** Only "blocking" stops a room from being Ready. Set by a supervisor. */
export type DefectPriority = 'blocking' | 'normal' | 'minor'
/** new = reported, not yet triaged; assigned = a technician owns it. */
export type DefectStatus = 'new' | 'assigned' | 'in_progress' | 'resolved'

export interface Staff {
    id: string
    name: string
    role: Role
    shift: Shift
}

export interface Room {
    /** Room number doubles as the id (for example "305"). */
    id: string
    floor: number
    type: string
    assigneeId: string
    inspection: InspectionStatus
    /** ISO timestamp of the latest inspection event (requested, passed or failed), if any. */
    inspectionAt?: string
}

export interface HousekeepingTask {
    id: string
    roomId: string
    title: string
    description: string
    /** Mandatory tasks must be Completed before the room can be Ready. */
    mandatory: boolean
    priority: TaskPriority
    status: TaskStatus
    assigneeId: string
    completedAt?: string
    /** Set while status is couldnt_complete. */
    incompleteReason?: IncompleteReason
    /** Optional free text from the housekeeper (required for "other"). Untrusted; rendered as plain text. */
    incompleteNote?: string
    incompleteAt?: string
    /** Defect created from this task by "Couldn't Complete: Needs maintenance". */
    linkedDefectId?: string
    /** Technician's resolution note, copied here when the linked defect is resolved. */
    repairNote?: string
}

export interface Defect {
    id: string
    roomId: string
    title: string
    description: string
    priority: DefectPriority
    status: DefectStatus
    reportedById: string
    reportedAt: string
    technicianId?: string
    assignedById?: string
    assignedAt?: string
    startedAt?: string
    resolvedAt?: string
    resolutionNotes?: string
    /** Housekeeping task this defect was raised from, if any. */
    sourceTaskId?: string
}

export type AuditAction =
    | 'task_completed'
    | 'task_couldnt_complete'
    | 'task_reopened'
    | 'defect_reported'
    | 'defect_assigned'
    | 'defect_priority_changed'
    | 'defect_started'
    | 'defect_resolved'
    | 'inspection_requested'
    | 'inspection_passed'
    | 'inspection_failed'
    | 'briefing_generated'

/** One row of the audit log: who did what, when. Entries are never edited or deleted. */
export interface AuditEntry {
    id: string
    at: string
    actorId: string
    action: AuditAction
    roomId?: string
    /** Id of the task, defect or request the action was about. */
    targetId?: string
    /** Plain-text description built by the system (may quote titles typed by staff; render as text). */
    summary: string
}

export interface Snapshot {
    rooms: Room[]
    tasks: HousekeepingTask[]
    defects: Defect[]
    staff: Staff[]
    audit: AuditEntry[]
    generatedAt: string
    source: 'mock' | 'servicenow'
}

export type BlockerKind = 'mandatory_tasks' | 'inspection' | 'blocking_defect'

export interface Blocker {
    kind: BlockerKind
    /** Short human-readable reason, safe to render as plain text. */
    message: string
    /** Used to rank blockers; higher means more urgent. */
    weight: number
    refIds: string[]
}

export interface ReadinessResult {
    status: RoomStatus
    isReady: boolean
    blockers: Blocker[]
    mandatoryTotal: number
    mandatoryDone: number
    /** Mandatory tasks marked Couldn't Complete. */
    mandatoryCouldntComplete: number
    /** Tasks (mandatory or optional) that are not Completed. */
    openTasks: number
    openBlockingDefects: number
    /** Plain-language explanation, for example "Room 305 cannot be marked Ready because ...". */
    summary: string
}

export interface RoomView {
    room: Room
    tasks: HousekeepingTask[]
    defects: Defect[]
    assignee: Staff | undefined
    readiness: ReadinessResult
    /** Highest priority among the room's open tasks. Only used for sorting. Undefined when nothing is open. */
    priority: TaskPriority | undefined
}

// ---------------------------------------------------------------- shift briefing (returned by the handoff endpoint)

export interface BriefingItem {
    roomId: string
    text: string
}

/** One row of the briefing table: a room of the outgoing shift that needs attention. Facts only, from the rules. */
export interface BriefingRoom {
    roomId: string
    status: RoomStatus
    housekeeper?: string
    mandatoryDone: number
    mandatoryTotal: number
    /** Tasks marked Couldn't Complete, with the reason category (never the free-text note). */
    couldntComplete: Array<{ task: string; reason: string }>
    /** Unresolved defects. */
    defects: Array<{ title: string; priority: DefectPriority; status: DefectStatus }>
    inspection: InspectionStatus
}

/** template: local preview. ai: written by the AI model. fallback: the AI was unavailable, so this is the template. */
export type BriefingSource = 'template' | 'ai' | 'fallback'

export interface Briefing {
    source: BriefingSource
    /** The AI model that wrote the narrative (source 'ai'). */
    model?: string
    /** Why the AI was not used (source 'fallback'); a short, safe phrase. */
    fallbackReason?: string
    shift: Shift
    incomingShift: Shift
    generatedAt: string
    counts: {
        rooms: number
        ready: number
        blocked: number
        pendingInspection: number
        mandatoryOpen: number
        couldntComplete: number
        unresolvedDefects: number
        blockingDefects: number
        awaitingTriage: number
    }
    summary: string
    priorities: BriefingItem[]
    blockedRooms: BriefingItem[]
    pendingInspections: BriefingItem[]
    outstandingTasks: BriefingItem[]
    /** Tasks marked Couldn't Complete. Only the reason category is used, never the free-text note. */
    couldntComplete: BriefingItem[]
    awaitingTriage: BriefingItem[]
    unresolvedDefects: BriefingItem[]
    /** Rooms that are not Ready or have an open defect or Couldn't Complete task: the briefing table. */
    rooms: BriefingRoom[]
    actions: string[]
}
