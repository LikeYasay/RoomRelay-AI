import { SHIFT_LABEL, SHIFT_ORDER } from '../../shared/domain/labels.ts'
import type { Shift, Snapshot } from '../../shared/domain/types.ts'
import { fail, withAudit } from '../../shared/domain/commandKit.ts'
import type { CommandContext, RuleResult } from '../../shared/domain/commandKit.ts'

/**
 * Records that a shift briefing was generated, so the audit log shows who used the
 * (future) AI feature and when. The briefing text itself is not stored.
 */
export function recordBriefingGenerated(snapshot: Snapshot, ctx: CommandContext, input: { shift: Shift }): RuleResult {
    if (ctx.actor.role !== 'supervisor') return fail('forbidden', 'Only a supervisor can generate a shift briefing.')
    if (!SHIFT_ORDER.includes(input.shift)) return fail('invalid', 'Choose a shift.')
    return {
        ok: true,
        snapshot: withAudit(snapshot, ctx, [
            { action: 'briefing_generated', summary: `${ctx.actor.name} generated the ${SHIFT_LABEL[input.shift]} briefing (simulated, not AI).` },
        ]),
    }
}
