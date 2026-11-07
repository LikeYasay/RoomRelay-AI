import React from 'react'
import { formatDateTime } from '../../shared/lib/format'
import { SHIFT_LABEL } from '../../shared/domain/labels'
import type { Briefing, BriefingItem } from './briefing'
import { Badge } from '../../shared/ui/Badge'
import { Banner } from '../../shared/ui/Banner'

function Section({ id, title, items, empty }: { id: string; title: string; items: BriefingItem[]; empty: string }) {
    return (
        <section aria-labelledby={id} className="briefing__section">
            <h3 id={id}>{title}</h3>
            {items.length === 0 ? (
                <p className="muted">{empty}</p>
            ) : (
                <ul className="briefing__list">
                    {items.map((item, i) => (
                        <li key={`${item.roomId}-${i}`}>
                            <a className="link" href={`#/rooms/${encodeURIComponent(item.roomId)}`}>
                                Room {item.roomId}
                            </a>
                            {/* Text can contain untrusted defect and task wording; React renders it as plain text. */}
                            <span>: {item.text}</span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

/** Says plainly where the text came from, so nobody mistakes the template for AI or the AI for a decision. */
function SourceNotice({ briefing }: { briefing: Briefing }) {
    if (briefing.source === 'ai') {
        return (
            <Banner tone="info">
                The summary, priorities and suggested actions were written by an AI model ({briefing.model ?? 'Groq'}) from a
                minimal summary of the rooms. The room lists below come straight from the readiness rules. The briefing is
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
    simulated: { tone: 'warning', label: 'Simulated briefing (not AI)' },
} as const

export function BriefingView({ briefing }: { briefing: Briefing }) {
    const badge = SOURCE_BADGE[briefing.source] ?? SOURCE_BADGE.simulated
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

            <Section id="b-priorities" title="Top priorities" items={briefing.priorities} empty="No urgent priorities for this shift." />
            <Section id="b-blocked" title="Blocked rooms" items={briefing.blockedRooms} empty="No blocked rooms." />
            <Section id="b-inspect" title="Pending inspections" items={briefing.pendingInspections} empty="No inspections are waiting." />
            <Section id="b-tasks" title="Outstanding tasks" items={briefing.outstandingTasks} empty="No outstanding mandatory tasks." />
            <Section id="b-incomplete" title="Tasks that couldn't be completed" items={briefing.couldntComplete} empty="Every task could be completed." />
            <Section id="b-triage" title="Reports awaiting triage" items={briefing.awaitingTriage} empty="No reports are waiting for a supervisor." />
            <Section id="b-defects" title="Unresolved defects" items={briefing.unresolvedDefects} empty="No unresolved defects." />

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
