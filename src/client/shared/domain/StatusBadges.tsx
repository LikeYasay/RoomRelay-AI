import React from 'react'
import { Badge } from '../ui/Badge'
import { DEFECT_PRIORITY_META, DEFECT_STATUS_META, ROOM_STATUS_META, TASK_PRIORITY_META, TASK_STATUS_META } from './labels'
import type { DefectPriority, DefectStatus, RoomStatus, TaskPriority, TaskStatus } from './types'

/** One badge per status in the hotel vocabulary, so every screen shows a status the same way. */

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
    const meta = ROOM_STATUS_META[status]
    return <Badge tone={meta.tone} label={meta.label} icon={meta.icon} />
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
    const meta = TASK_STATUS_META[status]
    return <Badge tone={meta.tone} label={meta.label} icon={meta.icon} />
}

/** "High" is the only task priority worth a colored badge; Normal and Low stay quiet. */
export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
    const meta = TASK_PRIORITY_META[priority]
    return <Badge tone={meta.tone} label={`${meta.label} priority`} icon={priority === 'high' ? meta.icon : undefined} />
}

export function DefectPriorityBadge({ priority }: { priority: DefectPriority }) {
    const meta = DEFECT_PRIORITY_META[priority]
    return <Badge tone={meta.tone} label={meta.label} icon={meta.icon} />
}

export function DefectStatusBadge({ status }: { status: DefectStatus }) {
    const meta = DEFECT_STATUS_META[status]
    return <Badge tone={meta.tone} label={meta.label} icon={meta.icon} />
}
