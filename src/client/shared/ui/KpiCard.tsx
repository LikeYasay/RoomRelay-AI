import React from 'react'
import type { Tone } from './tone'

interface KpiCardProps {
    label: string
    value: number | string
    hint?: string
    /** Adds a small colored marker. The label always carries the meaning too. */
    tone?: Tone
}

/** One cell in a compact summary strip (not a standalone card). */
export function KpiCard({ label, value, hint, tone = 'neutral' }: KpiCardProps) {
    return (
        <div className={`kpi kpi--${tone}`}>
            <p className="kpi__label">{label}</p>
            <p className="kpi__value">{value}</p>
            {hint ? <p className="kpi__hint">{hint}</p> : null}
        </div>
    )
}
