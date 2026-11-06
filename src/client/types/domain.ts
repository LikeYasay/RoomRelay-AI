/**
 * Domain types for RoomRelay AI.
 *
 * PROTOTYPE NOTE: these shapes describe the synthetic dataset used in Phase 1.
 * In Phase 4 they will be mapped from ServiceNow scoped-table records. Roles and
 * statuses defined here are for display only; real authorization is enforced
 * by ServiceNow (roles, ACLs, Business Rules), never by this client code.
 */

export type Role = 'housekeeping' | 'maintenance' | 'supervisor' | 'admin'
export type Shift = 'morning' | 'afternoon' | 'night'

/** Final, derived room status. Cleaning progress is NOT the same as Ready. */
export type RoomStatus = 'needs_cleaning' | 'in_progress' | 'pending_inspection' | 'blocked' | 'ready'

export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'normal' | 'high' | 'urgent'
export type Severity = 'low' | 'medium' | 'high' | 'critical'
export type DefectStatus = 'open' | 'in_progress' | 'resolved'
export type InspectionStatus = 'not_requested' | 'pending' | 'passed' | 'failed'
export type SupervisorReview = 'not_required' | 'pending' | 'approved'

export interface Staff {
    id: string
    name: string
    role: Role
    shift: Shift
}

export interface Room {
    /** Room number doubles as the id in the prototype (for example "305"). */
    id: string
    floor: number
    type: string
    assigneeId: string
    inspection: InspectionStatus
    /** ISO timestamp of the latest inspection event, if any. */
    inspectionAt?: string
}

export interface HousekeepingTask {
    id: string
    roomId: string
    title: string
    description: string
    mandatory: boolean
    priority: Priority
    status: TaskStatus
    assigneeId: string
    supervisorReview: SupervisorReview
    completedAt?: string
}

export interface Defect {
    id: string
    roomId: string
    title: string
    description: string
    severity: Severity
    /** A blocking defect prevents the room from being Ready until resolved. */
    blocking: boolean
    status: DefectStatus
    technicianId?: string
    reportedAt: string
    resolvedAt?: string
    resolutionNotes?: string
}

export interface Snapshot {
    rooms: Room[]
    tasks: HousekeepingTask[]
    defects: Defect[]
    staff: Staff[]
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
}

export interface ActivityEntry {
    id: string
    at: string
    roomId: string
    kind: 'task_completed' | 'defect_reported' | 'defect_resolved' | 'inspection_passed' | 'inspection_failed'
    text: string
}
