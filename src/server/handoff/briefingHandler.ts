import { GlideRecord } from '@servicenow/glide'
import { applyAiNarrative, asFallback, BRIEFING_RATE_LIMIT, buildAiInput, buildAiMessages, parseAiReply } from '../../client/features/handoff/aiBriefing.ts'
import { buildSimulatedBriefing } from '../../client/features/handoff/briefing.ts'
import { recordBriefingGenerated } from '../../client/features/handoff/handoffCommands.ts'
import { buildRoomViews } from '../../client/features/rooms/roomViews.ts'
import { SHIFT_ORDER } from '../../client/shared/domain/labels.ts'
import type { Briefing, Staff } from '../../client/shared/domain/types.ts'
import { loadSnapshot, saveChanges } from '../data/repository.ts'
import { readJson, sendError, sendOk } from '../shared/http.ts'
import type { RestRequest, RestResponse } from '../shared/http.ts'
import { TABLES } from '../shared/tables.ts'
import { nowIso, toGlide } from '../shared/time.ts'
import { callGroq, GROQ_MODEL } from './groq.ts'

/**
 * POST /handoff/briefing  { "shift": "morning" | "afternoon" | "night" }
 * Supervisors only. Builds the template briefing, asks the AI to rewrite its narrative, and returns
 * the AI version or, on any problem, the template labeled as a fallback. Every briefing is audited.
 */

/** How many briefings this user generated in the rate-limit window (counted from the audit log). */
function recentBriefings(userId: string, now: string): number {
    const since = new Date(Date.parse(now) - BRIEFING_RATE_LIMIT.windowMinutes * 60_000).toISOString()
    const gr = new GlideRecord(TABLES.audit)
    gr.addQuery('actor', userId)
    gr.addQuery('action', 'briefing_generated')
    gr.addQuery('at', '>=', toGlide(since))
    gr.query()
    return gr.getRowCount()
}

export function handleBriefing(request: RestRequest, response: RestResponse, caller: Staff, staff: Staff[]): void {
    if (caller.role !== 'supervisor') {
        sendError(response, 'forbidden', 'Only a supervisor can generate a shift briefing.')
        return
    }
    const body = readJson(request)
    const fields = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
    const shift = SHIFT_ORDER.find((s) => s === fields.shift)
    if (!shift || Object.keys(fields).some((k) => k !== 'shift')) {
        sendError(response, 'invalid', 'Choose a shift.')
        return
    }

    const now = nowIso()
    if (recentBriefings(caller.id, now) >= BRIEFING_RATE_LIMIT.max) {
        sendError(response, 'rate_limited', `You can generate ${BRIEFING_RATE_LIMIT.max} briefings every ${BRIEFING_RATE_LIMIT.windowMinutes} minutes. Please wait a moment.`)
        return
    }

    // A supervisor sees every room, so the template and the AI get the same, complete view.
    const { snapshot, ids } = loadSnapshot(staff, { withAudit: false })
    const views = buildRoomViews(snapshot)
    const template = buildSimulatedBriefing(views, shift, now)
    const input = buildAiInput(views, template)
    const shiftRooms = new Set(views.filter((v) => v.assignee?.shift === shift).map((v) => v.room.id))

    let briefing: Briefing
    const ai = callGroq(buildAiMessages(input))
    if (ai.ok) {
        const parsed = parseAiReply(ai.content, shiftRooms)
        briefing = parsed.ok ? applyAiNarrative(template, parsed.narrative, GROQ_MODEL) : asFallback(template, parsed.reason)
    } else {
        briefing = asFallback(template, ai.reason)
    }

    const audited = recordBriefingGenerated(snapshot, { actor: caller, now }, { shift, source: briefing.source })
    if (audited.ok) saveChanges(snapshot, audited.snapshot, ids)
    sendOk(response, { briefing })
}
