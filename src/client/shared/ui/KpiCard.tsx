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
            {/* The coloured line is its own element (not a border), so design tools that give a shape one
                border colour still draw the card the same way. */}
            <span className="kpi__bar" aria-hidden="true" />
            <p className="kpi__label">{label}</p>
            <p className="kpi__value">{value}</p>
            {hint ? <p className="kpi__hint">{hint}</p> : null}
        </div>
    )
}
