import React from 'react'
import {
    DEFECT_STATUS_LABEL,
    PRIORITY_LABEL,
    ROOM_STATUS_META,
    SEVERITY_META,
    TASK_STATUS_LABEL,
} from '../../domain/labels'
import type { Tone } from '../../domain/labels'
import type { DefectStatus, Priority, RoomStatus, Severity, SupervisorReview, TaskStatus } from '../../types/domain'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface BadgeProps {
    tone: Tone
    label: string
    icon?: IconName
}

/** Status pill. The icon and text carry the meaning; color is reinforcement only. */
export function Badge({ tone, label, icon }: BadgeProps) {
    return (
        <span className={`badge badge--${tone}`}>
            {icon ? <Icon name={icon} size={14} /> : null}
            {label}
        </span>
    )
}

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
    const meta = ROOM_STATUS_META[status]
    return <Badge tone={meta.tone} label={meta.label} icon={meta.icon} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
    const tone: Tone = priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : 'neutral'
    return <Badge tone={tone} label={`${PRIORITY_LABEL[priority]} priority`} />
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
    if (status === 'done') return <Badge tone="success" label={TASK_STATUS_LABEL.done} icon="check-circle" />
    if (status === 'in_progress') return <Badge tone="info" label={TASK_STATUS_LABEL.in_progress} icon="clock" />
    return <Badge tone="neutral" label={TASK_STATUS_LABEL.todo} icon="circle" />
}

export function ReviewBadge({ review }: { review: SupervisorReview }) {
    if (review === 'approved') return <Badge tone="success" label="Review approved" icon="check-circle" />
    if (review === 'pending') return <Badge tone="review" label="Awaiting review" icon="clipboard-check" />
    return <span className="muted">Not required</span>
}

export function DefectStatusBadge({ status }: { status: DefectStatus }) {
    const tone: Tone = status === 'resolved' ? 'success' : status === 'in_progress' ? 'info' : 'warning'
    const icon: IconName = status === 'resolved' ? 'check-circle' : status === 'in_progress' ? 'clock' : 'alert-small'
    return <Badge tone={tone} label={DEFECT_STATUS_LABEL[status]} icon={icon} />
}

export function SeverityBadge({ severity }: { severity: Severity }) {
    const meta = SEVERITY_META[severity]
    return <Badge tone={meta.tone} label={meta.label} icon={meta.icon} />
}
