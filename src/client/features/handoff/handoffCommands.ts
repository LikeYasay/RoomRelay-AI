import { SHIFT_LABEL, SHIFT_ORDER } from '../../shared/domain/labels.ts'
import type { Shift, Snapshot } from '../../shared/domain/types.ts'
import { fail, withAudit } from '../../shared/domain/commandKit.ts'
import type { CommandContext, RuleResult } from '../../shared/domain/commandKit.ts'
import type { BriefingSource } from './briefing.ts'

const SOURCE_NOTE: Record<BriefingSource, string> = {
    template: 'template, no AI',
    ai: 'written by AI',
    fallback: 'AI unavailable, template used',
}

/**
 * Records that a shift briefing was generated, so the audit log shows who used the AI feature,
 * when, and whether the AI or the fallback template wrote it. The briefing text is not stored.
 */
export function recordBriefingGenerated(snapshot: Snapshot, ctx: CommandContext, input: { shift: Shift; source?: BriefingSource }): RuleResult {
    if (ctx.actor.role !== 'supervisor') return fail('forbidden', 'Only a supervisor can generate a shift briefing.')
    if (!SHIFT_ORDER.includes(input.shift)) return fail('invalid', 'Choose a shift.')
    return {
        ok: true,
        snapshot: withAudit(snapshot, ctx, [
            { action: 'briefing_generated', summary: `${ctx.actor.name} generated the ${SHIFT_LABEL[input.shift]} briefing (${SOURCE_NOTE[input.source ?? 'template']}).` },
        ]),
    }
}
