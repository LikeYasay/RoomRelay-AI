import type {
    DefectStatus,
    InspectionStatus,
    Priority,
    Role,
    RoomStatus,
    Severity,
    Shift,
    TaskStatus,
} from '../types/domain'
import type { IconName } from '../components/ui/Icon'

/** Visual tone. Every tone is always paired with an icon AND a text label (never color alone). */
export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'review' | 'neutral'

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

export const SEVERITY_META: Record<Severity, Meta> = {
    low: { label: 'Low', tone: 'neutral', icon: 'info' },
    medium: { label: 'Medium', tone: 'warning', icon: 'alert-small' },
    high: { label: 'High', tone: 'danger', icon: 'alert' },
    critical: { label: 'Critical', tone: 'danger', icon: 'alert' },
}

export const ROLE_LABEL: Record<Role, string> = {
    housekeeping: 'Housekeeping Staff',
    maintenance: 'Maintenance Staff',
    supervisor: 'Housekeeping Supervisor',
    admin: 'System Administrator',
}

export const SHIFT_LABEL: Record<Shift, string> = {
    morning: 'Morning shift',
    afternoon: 'Afternoon shift',
    night: 'Night shift',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
    todo: 'To do',
    in_progress: 'In progress',
    done: 'Done',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
    low: 'Low',
    normal: 'Normal',
    high: 'High',
    urgent: 'Urgent',
}

export const DEFECT_STATUS_LABEL: Record<DefectStatus, string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
}

export const INSPECTION_LABEL: Record<InspectionStatus, string> = {
    not_requested: 'Not requested',
    pending: 'Pending',
    passed: 'Passed',
    failed: 'Failed',
}
