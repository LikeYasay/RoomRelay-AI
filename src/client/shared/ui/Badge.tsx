import React from 'react'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import type { Tone } from './tone'

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
