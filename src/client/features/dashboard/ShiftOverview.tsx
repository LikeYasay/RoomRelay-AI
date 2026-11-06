import React from 'react'
import { SHIFT_LABEL } from '../../domain/labels'
import { percent, plural } from '../../domain/format'
import type { ShiftSummary } from '../../domain/selectors'

export function ShiftOverview({ shifts }: { shifts: ShiftSummary[] }) {
    return (
        <ul className="shifts">
            {shifts.map((s) => {
                const pct = percent(s.readyRooms, s.totalRooms)
                const label = `${SHIFT_LABEL[s.shift]} readiness`
                return (
                    <li key={s.shift} className="shifts__item">
                        <div className="shifts__head">
                            <h3>{SHIFT_LABEL[s.shift]}</h3>
                            <span className="shifts__pct">{pct}% ready</span>
                        </div>
                        <div
                            className="progress"
                            role="progressbar"
                            aria-label={label}
                            aria-valuemin={0}
                            aria-valuemax={s.totalRooms}
                            aria-valuenow={s.readyRooms}
                            aria-valuetext={`${s.readyRooms} of ${s.totalRooms} rooms ready`}
                        >
                            <span className="progress__fill" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="shifts__meta">
                            {s.readyRooms} of {s.totalRooms} rooms ready · {plural(s.openTasks, 'open task')} ·{' '}
                            {plural(s.unresolvedDefects, 'unresolved defect')}
                        </p>
                        <p className="shifts__staff muted">{s.staff.map((p) => p.name).join(', ')}</p>
                    </li>
                )
            })}
        </ul>
    )
}
