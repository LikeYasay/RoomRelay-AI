import React from 'react'
import { ROOM_STATUS_META } from '../../shared/domain/labels'
import { STATUS_ORDER } from '../rooms/roomViews'
import type { FloorBreakdown } from './dashboardStats'

export function FloorBars({ floors }: { floors: FloorBreakdown[] }) {
    return (
        <ul className="floors">
            {floors.map((f) => {
                const summary = STATUS_ORDER.filter((s) => f.byStatus[s] > 0)
                    .map((s) => `${ROOM_STATUS_META[s].label} ${f.byStatus[s]}`)
                    .join(', ')
                return (
                    <li key={f.floor} className="floors__row">
                        <span className="floors__label">Floor {f.floor}</span>
                        <div className="floors__bar" role="img" aria-label={`Floor ${f.floor}, ${f.total} rooms: ${summary}`}>
                            {STATUS_ORDER.map((s) =>
                                f.byStatus[s] > 0 ? (
                                    <span
                                        key={s}
                                        className={`floors__seg floors__seg--${ROOM_STATUS_META[s].tone}`}
                                        style={{ flexGrow: f.byStatus[s] }}
                                        title={`${ROOM_STATUS_META[s].label}: ${f.byStatus[s]}`}
                                    />
                                ) : null
                            )}
                        </div>
                        <span className="floors__count">
                            {f.byStatus.ready} of {f.total} ready
                        </span>
                    </li>
                )
            })}
        </ul>
    )
}
