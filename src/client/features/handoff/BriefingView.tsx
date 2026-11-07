import React, { useMemo } from 'react'
import { formatDateTime } from '../../shared/lib/format'
import { DEFECT_PRIORITY_META, DEFECT_STATUS_META, INSPECTION_LABEL, ROOM_STATUS_META, SHIFT_LABEL } from '../../shared/domain/labels'
import type { Briefing, BriefingItem, BriefingRoom } from './briefing'
import { Badge } from '../../shared/ui/Badge'
import { Banner } from '../../shared/ui/Banner'

/** Says plainly where the text came from, so nobody mistakes the template for AI or the AI for a decision. */
function SourceNotice({ briefing }: { briefing: Briefing }) {
    if (briefing.source === 'ai') {
        return (
            <Banner tone="info">
                The summary, priorities and suggested actions were written by an AI model ({briefing.model ?? 'Groq'}) from a
                minimal summary of the rooms. The table's room facts come straight from the readiness rules. The briefing is
                informational only and cannot approve a room. Check anything important in the room itself.
            </Banner>
        )
    }
    if (briefing.source === 'fallback') {
        return (
            <Banner tone="warning">
                The AI was not used for this briefing ({briefing.fallbackReason ?? 'it was unavailable'}), so the fixed template
                was used instead. It is informational only and cannot approve a room.
            </Banner>
        )
    }
    return (
        <Banner tone="info">
            This text comes from a fixed local template, not an AI model. It is informational only and cannot approve a room:
            Ready status is decided by the readiness rules.
        </Banner>
    )
}

const SOURCE_BADGE = {
    ai: { tone: 'info', label: 'AI briefing' },
    fallback: { tone: 'warning', label: 'Fallback template (not AI)' },
    template: { tone: 'neutral', label: 'Template briefing (no AI)' },
} as const

type Row = BriefingRoom & { rank?: number; why?: string }

/** Rooms with a priority come first, in priority order; the rest keep the rules' order (blocked first). */
function buildRows(rooms: BriefingRoom[], priorities: BriefingItem[]): { rows: Row[]; other: BriefingItem[] } {
    const rankOf = new Map<string, { rank: number; why: string }>()
    priorities.forEach((p, i) => {
        if (!rankOf.has(p.roomId)) rankOf.set(p.roomId, { rank: i + 1, why: p.text })
    })
    const rows: Row[] = rooms.map((r) => ({ ...r, ...rankOf.get(r.roomId) }))
    rows.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    const inTable = new Set(rooms.map((r) => r.roomId))
    return { rows, other: priorities.filter((p) => !inTable.has(p.roomId)) }
}

/* Every text below can contain staff-typed wording (task and defect titles); React renders it as plain text. */

function TasksCell({ room }: { room: BriefingRoom }) {
    const open = room.mandatoryTotal - room.mandatoryDone
    return (
        <>
            <div>{room.mandatoryTotal === 0 ? 'No mandatory tasks' : `${room.mandatoryDone} of ${room.mandatoryTotal} done`}</div>
            {open > 0 && room.mandatoryTotal > 0 ? <div className="muted">{open} still open</div> : null}
            {room.couldntComplete.map((c, i) => (
                <div key={i} className="briefing-table__note">
                    Couldn't complete: {c.task} ({c.reason})
                </div>
            ))}
        </>
    )
}

function DefectsCell({ room }: { room: BriefingRoom }) {
    if (room.defects.length === 0) return <span className="muted">None</span>
    return (
        <ul className="briefing-table__defects">
            {room.defects.map((d, i) => (
                <li key={i}>
                    <span>{d.title}</span>{' '}
                    <span className="muted">
                        ({DEFECT_PRIORITY_META[d.priority].label}, {d.status === 'new' ? 'awaiting triage' : DEFECT_STATUS_META[d.status].label.toLowerCase()})
                    </span>
                </li>
            ))}
        </ul>
    )
}

function RoomsTable({ briefing }: { briefing: Briefing }) {
    const { rows, other } = useMemo(() => buildRows(briefing.rooms ?? [], briefing.priorities), [briefing])
    const priorityHeading = briefing.source === 'ai' ? 'AI priority' : 'Priority'

    if (rows.length === 0) return <p className="muted">Every room for this shift is Ready and has no open issues.</p>

    return (
        <>
            <div className="table-wrap">
                <table className="table table--stack briefing-table">
                    <caption className="sr-only">Rooms needing attention, one row per room</caption>
                    <thead>
                        <tr>
                            <th scope="col">Room</th>
                            <th scope="col">Status</th>
                            <th scope="col">Housekeeper</th>
                            <th scope="col">Mandatory tasks</th>
                            <th scope="col">Defects</th>
                            <th scope="col">Inspection</th>
                            <th scope="col">{priorityHeading}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((r) => {
                            const status = ROOM_STATUS_META[r.status]
                            return (
                                <tr key={r.roomId}>
                                    <th scope="row">
                                        <a className="link" href={`#/rooms/${encodeURIComponent(r.roomId)}`}>
                                            Room {r.roomId}
                                        </a>
                                    </th>
                                    <td data-label="Status">
                                        <Badge tone={status.tone} label={status.label} icon={status.icon} />
                                    </td>
                                    <td data-label="Housekeeper">{r.housekeeper ?? <span className="muted">Unassigned</span>}</td>
                                    <td data-label="Mandatory tasks">
                                        <TasksCell room={r} />
                                    </td>
                                    <td data-label="Defects">
                                        <DefectsCell room={r} />
                                    </td>
                                    <td data-label="Inspection">{INSPECTION_LABEL[r.inspection]}</td>
                                    <td data-label={priorityHeading} className="briefing-table__why">
                                        {r.rank ? (
                                            <>
                                                <strong>{r.rank}</strong> <span>{r.why}</span>
                                            </>
                                        ) : (
                                            <span className="muted">—</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            {other.length > 0 ? (
                <ul className="briefing__list">
                    {other.map((p, i) => (
                        <li key={i}>
                            <a className="link" href={`#/rooms/${encodeURIComponent(p.roomId)}`}>
                                Room {p.roomId}
                            </a>
                            <span>: {p.text}</span>
                        </li>
                    ))}
                </ul>
            ) : null}
        </>
    )
}

export function BriefingView({ briefing }: { briefing: Briefing }) {
    const badge = SOURCE_BADGE[briefing.source] ?? SOURCE_BADGE.template
    const { counts } = briefing
    return (
        <article className="briefing" aria-label="Shift handoff briefing">
            <div className="briefing__badges">
                <Badge tone={badge.tone} label={badge.label} icon="info" />
                <Badge tone="neutral" label={`${SHIFT_LABEL[briefing.shift]} to ${SHIFT_LABEL[briefing.incomingShift]}`} />
                <span className="muted">Generated {formatDateTime(briefing.generatedAt)}</span>
            </div>

            <SourceNotice briefing={briefing} />

            <section aria-labelledby="b-summary" className="briefing__section">
                <h3 id="b-summary">Summary</h3>
                <p>{briefing.summary}</p>
            </section>

            <section aria-labelledby="b-rooms" className="briefing__section">
                <h3 id="b-rooms">Rooms needing attention ({(briefing.rooms ?? []).length})</h3>
                <p className="muted briefing__caption">
                    {counts.ready} of {counts.rooms} rooms are Ready. Facts come from the readiness rules; the{' '}
                    {briefing.source === 'ai' ? 'AI priority column was written by the AI' : 'priority column is from the template'}.
                </p>
                <RoomsTable briefing={briefing} />
            </section>

            <section aria-labelledby="b-actions" className="briefing__section">
                <h3 id="b-actions">Suggested actions for the incoming shift</h3>
                <ol className="briefing__actions">
                    {briefing.actions.map((a, i) => (
                        <li key={i}>{a}</li>
                    ))}
                </ol>
            </section>
        </article>
    )
}
