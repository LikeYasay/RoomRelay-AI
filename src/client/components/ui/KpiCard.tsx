import React from 'react'
import type { Tone } from '../../domain/labels'
import { Icon } from './Icon'
import type { IconName } from './Icon'

interface KpiCardProps {
    label: string
    value: number | string
    hint?: string
    tone?: Tone
    icon: IconName
}

export function KpiCard({ label, value, hint, tone = 'neutral', icon }: KpiCardProps) {
    return (
        <article className={`kpi kpi--${tone}`}>
            <div className="kpi__icon">
                <Icon name={icon} size={22} />
            </div>
            <div className="kpi__body">
                <p className="kpi__label">{label}</p>
                <p className="kpi__value">{value}</p>
                {hint ? <p className="kpi__hint">{hint}</p> : null}
            </div>
        </article>
    )
}
