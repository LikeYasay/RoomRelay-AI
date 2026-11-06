import React from 'react'
import { ROOM_STATUS_META } from '../../domain/labels'
import { STATUS_ORDER } from '../../domain/selectors'
import { Icon } from '../../components/ui/Icon'

/** Shared legend: icon + text label for each status, so color is never the only cue. */
export function StatusLegend() {
    return (
        <ul className="legend" aria-label="Status legend">
            {STATUS_ORDER.map((s) => {
                const meta = ROOM_STATUS_META[s]
                return (
                    <li key={s} className={`legend__item legend__item--${meta.tone}`}>
                        <Icon name={meta.icon} size={14} />
                        {meta.label}
                    </li>
                )
            })}
        </ul>
    )
}
