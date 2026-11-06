import type {
    AuditAction,
    DefectPriority,
    DefectStatus,
    IncompleteReason,
    InspectionStatus,
    Role,
    RoomStatus,
    Shift,
    TaskPriority,
    TaskStatus,
} from './types.ts'
import type { IconName } from '../ui/iconPaths.ts'
import type { Tone } from '../ui/tone.ts'

/**
 * The words and looks of the hotel vocabulary: every status label, tone and icon in one place.
 * Screens never hard-code these strings. docs/GLOSSARY.md explains each term.
 */

interface Meta {
    label: string
    tone: Tone
    icon: IconName
}

export const ROOM_STATUS_META: Record<RoomStatus, Meta> = {
    ready: { label: 'Ready', tone: 'success', icon: 'check-circle' },
    needs_cleaning: { label: 'Needs Cleaning', tone: 'warning', icon: 'sparkles' },
    in_progress: { label: 'In Progress', tone: 'info', icon: 'clock' },
    pending_inspection: { label: 'Pending Inspection', tone: 'review', icon: 'clipboard-check' },
    blocked: { label: 'Blocked', tone: 'danger', icon: 'alert' },
}

export const TASK_STATUS_META: Record<TaskStatus, Meta> = {
    pending: { label: 'Pending', tone: 'neutral', icon: 'circle' },
    completed: { label: 'Completed', tone: 'success', icon: 'check-circle' },
    couldnt_complete: { label: "Couldn't Complete", tone: 'warning', icon: 'alert-small' },
}

export const TASK_PRIORITY_META: Record<TaskPriority, Meta> = {
    high: { label: 'High', tone: 'warning', icon: 'alert-small' },
    normal: { label: 'Normal', tone: 'neutral', icon: 'circle' },
    low: { label: 'Low', tone: 'neutral', icon: 'circle' },
}
export const TASK_PRIORITY_ORDER: TaskPriority[] = ['high', 'normal', 'low']

export const INCOMPLETE_REASON_LABEL: Record<IncompleteReason, string> = {
    supplies_missing: 'Supplies missing',
    needs_maintenance: 'Needs maintenance',
    other: 'Other',
}
export const INCOMPLETE_REASONS: IncompleteReason[] = ['supplies_missing', 'needs_maintenance', 'other']

export const DEFECT_PRIORITY_META: Record<DefectPriority, Meta> = {
    blocking: { label: 'Blocking', tone: 'danger', icon: 'lock' },
    normal: { label: 'Normal', tone: 'warning', icon: 'alert-small' },
    minor: { label: 'Minor', tone: 'neutral', icon: 'info' },
}
export const DEFECT_PRIORITY_ORDER: DefectPriority[] = ['blocking', 'normal', 'minor']

export const DEFECT_STATUS_META: Record<DefectStatus, Meta> = {
    new: { label: 'New', tone: 'review', icon: 'alert-small' },
    assigned: { label: 'Assigned', tone: 'warning', icon: 'user' },
    in_progress: { label: 'In progress', tone: 'info', icon: 'clock' },
    resolved: { label: 'Resolved', tone: 'success', icon: 'check-circle' },
}
export const DEFECT_STATUS_ORDER: DefectStatus[] = ['new', 'assigned', 'in_progress', 'resolved']

export const ROLE_LABEL: Record<Role, string> = {
    housekeeping: 'Housekeeping Staff',
    maintenance: 'Maintenance Staff',
    supervisor: 'Housekeeping Supervisor',
    admin: 'System Administrator',
}

export const SHIFT_ORDER: Shift[] = ['morning', 'afternoon', 'night']

export const SHIFT_LABEL: Record<Shift, string> = {
    morning: 'Morning shift',
    afternoon: 'Afternoon shift',
    night: 'Night shift',
}

export const INSPECTION_LABEL: Record<InspectionStatus, string> = {
    not_requested: 'Not requested',
    pending: 'Pending',
    passed: 'Passed',
    failed: 'Failed',
}

export const AUDIT_ACTION_META: Record<AuditAction, { label: string; icon: IconName }> = {
    task_completed: { label: 'Task completed', icon: 'check-circle' },
    task_couldnt_complete: { label: "Task couldn't be completed", icon: 'alert-small' },
    task_reopened: { label: 'Task set back to Pending', icon: 'refresh' },
    defect_reported: { label: 'Defect reported', icon: 'alert' },
    defect_assigned: { label: 'Defect assigned', icon: 'user' },
    defect_priority_changed: { label: 'Defect priority changed', icon: 'list' },
    defect_started: { label: 'Repair started', icon: 'wrench' },
    defect_resolved: { label: 'Defect resolved', icon: 'wrench' },
    inspection_requested: { label: 'Inspection requested', icon: 'clipboard-check' },
    inspection_passed: { label: 'Inspection passed, room Ready', icon: 'clipboard-check' },
    inspection_failed: { label: 'Inspection failed', icon: 'alert-small' },
    briefing_generated: { label: 'Shift briefing generated', icon: 'sparkles' },
    access_request_approved: { label: 'Access request approved', icon: 'users' },
    access_request_declined: { label: 'Access request declined', icon: 'users' },
}
