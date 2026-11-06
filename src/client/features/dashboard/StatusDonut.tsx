import React from 'react'
import { ROOM_STATUS_META } from '../../domain/labels'
import { percent } from '../../domain/format'
import { STATUS_ORDER } from '../../domain/selectors'
import type { Kpis } from '../../domain/selectors'
import { Icon } from '../../components/ui/Icon'

const RADIUS = 48
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function StatusDonut({ kpis }: { kpis: Kpis }) {
    let offset = 0
    const summary = STATUS_ORDER.map((s) => `${ROOM_STATUS_META[s].label} ${kpis.byStatus[s]}`).join(', ')

    return (
        <div className="donut">
            <div className="donut__chart">
                <svg viewBox="0 0 120 120" role="img" aria-label={`Rooms by status out of ${kpis.totalRooms}: ${summary}`}>
                    <circle className="donut__track" cx="60" cy="60" r={RADIUS} fill="none" strokeWidth="14" />
                    {STATUS_ORDER.map((s) => {
                        const count = kpis.byStatus[s]
                        if (count === 0 || kpis.totalRooms === 0) return null
                        const length = (count / kpis.totalRooms) * CIRCUMFERENCE
                        const circle = (
                            <circle
                                key={s}
                                className={`donut__seg donut__seg--${ROOM_STATUS_META[s].tone}`}
                                cx="60"
                                cy="60"
                                r={RADIUS}
                                fill="none"
                                strokeWidth="14"
                                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                                strokeDashoffset={-offset}
                                transform="rotate(-90 60 60)"
                            />
                        )
                        offset += length
                        return circle
                    })}
                </svg>
                <div className="donut__center" aria-hidden="true">
                    <strong>{kpis.readyPercent}%</strong>
                    <span>Ready</span>
                </div>
            </div>

            <ul className="donut__legend">
                {STATUS_ORDER.map((s) => {
                    const meta = ROOM_STATUS_META[s]
                    return (
                        <li key={s}>
                            <span className={`legend__item legend__item--${meta.tone}`}>
                                <Icon name={meta.icon} size={14} />
                                {meta.label}
                            </span>
                            <span className="donut__count">
                                <strong>{kpis.byStatus[s]}</strong>
                                <span className="muted"> ({percent(kpis.byStatus[s], kpis.totalRooms)}%)</span>
                            </span>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
