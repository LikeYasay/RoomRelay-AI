import React from 'react'
import { ROOM_STATUS_META } from '../../domain/labels'
import { percent } from '../../domain/format'
import { STATUS_ORDER } from '../../domain/selectors'
import type { Kpis } from '../../domain/selectors'
import { RoomStatusBadge } from '../../components/ui/Badge'

/** One proportional bar plus a plain table. Counts are always shown as numbers, never only as color. */
export function StatusBreakdown({ kpis }: { kpis: Kpis }) {
    const summary = STATUS_ORDER.map((s) => `${ROOM_STATUS_META[s].label} ${kpis.byStatus[s]}`).join(', ')

    return (
        <div>
            <div className="stack-bar" role="img" aria-label={`Rooms by status out of ${kpis.totalRooms}: ${summary}`}>
                {STATUS_ORDER.map((s) =>
                    kpis.byStatus[s] > 0 ? (
                        <span
                            key={s}
                            className={`stack-bar__seg stack-bar__seg--${ROOM_STATUS_META[s].tone}`}
                            style={{ flexGrow: kpis.byStatus[s] }}
                        />
                    ) : null
                )}
            </div>
            <table className="mini-table">
                <caption className="sr-only">Rooms by status</caption>
                <thead>
                    <tr>
                        <th scope="col">Status</th>
                        <th scope="col" className="num">
                            Rooms
                        </th>
                        <th scope="col" className="num">
                            Share
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {STATUS_ORDER.map((s) => (
                        <tr key={s}>
                            <th scope="row">
                                <RoomStatusBadge status={s} />
                            </th>
                            <td className="num">{kpis.byStatus[s]}</td>
                            <td className="num muted">{percent(kpis.byStatus[s], kpis.totalRooms)}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
