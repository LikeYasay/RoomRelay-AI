import React, { useEffect, useRef, useState } from 'react'
import { DataGate, useCommands } from '../../shared/api/DataContext'
import { ApiError } from '../../shared/api/dataSource'
import { APP_MODE } from '../../shared/api/environment'
import { briefingToText, nextShift } from './briefing'
import type { Briefing } from './briefing'
import { SHIFT_LABEL, SHIFT_ORDER } from '../../shared/domain/labels'
import type { Shift } from '../../shared/domain/types'
import { Banner } from '../../shared/ui/Banner'
import { Icon } from '../../shared/ui/Icon'
import { LoadingState, StateScreen } from '../../shared/ui/StateScreen'
import { BriefingView } from './BriefingView'

type Generation =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; briefing: Briefing }
    | { status: 'error'; message: string }

type CopyState = 'idle' | 'copied' | 'failed'

const isShift = (v: string): v is Shift => (SHIFT_ORDER as string[]).includes(v)

export function HandoffScreen() {
    return <DataGate loadingLabel="Loading shift data">{() => <Handoff />}</DataGate>
}

/**
 * Supervisors pick the outgoing shift and generate the briefing. Inside ServiceNow the server asks
 * the AI (Groq) and falls back to the template if anything goes wrong; the local preview always
 * uses the template. Either way the briefing cannot change any room.
 */
function Handoff() {
    const { generateBriefing } = useCommands()
    const [shift, setShift] = useState<Shift>('morning')
    const [simulateFailure, setSimulateFailure] = useState(false)
    const [generation, setGeneration] = useState<Generation>({ status: 'idle' })
    const [copy, setCopy] = useState<CopyState>('idle')
    // Each request gets a number, so a late answer for an earlier shift is ignored.
    const latest = useRef(0)

    useEffect(() => () => {
        latest.current += 1 // leaving the screen: ignore any answer still on its way
    }, [])

    const changeShift = (next: Shift) => {
        latest.current += 1
        setShift(next)
        setGeneration({ status: 'idle' })
        setCopy('idle')
    }

    const generate = async () => {
        if (generation.status === 'loading') return // ignore duplicate clicks while one is running
        const request = ++latest.current
        setGeneration({ status: 'loading' })
        setCopy('idle')
        try {
            if (APP_MODE === 'demo' && simulateFailure) throw new ApiError('server', 'The briefing could not be generated. No briefing was produced. Please try again.')
            const briefing = await generateBriefing(shift)
            if (request === latest.current) setGeneration({ status: 'ready', briefing })
        } catch (err: unknown) {
            const message = err instanceof ApiError ? err.message : new ApiError('server').message
            if (request === latest.current) setGeneration({ status: 'error', message })
        }
    }

    const copyBriefing = async (briefing: Briefing) => {
        try {
            await navigator.clipboard.writeText(briefingToText(briefing))
            setCopy('copied')
        } catch {
            // Clipboard can be blocked (permissions, embedded pages). Tell the user instead of failing silently.
            setCopy('failed')
        }
    }

    return (
        <div className="stack">
            {APP_MODE === 'servicenow' ? (
                <Banner tone="info">
                    <strong>AI briefing.</strong> The ServiceNow server sends a minimal summary of the rooms (no names or notes) to an AI
                    model (Groq), which writes the summary, priorities and suggested actions. The room lists come from the readiness
                    rules. If the AI is unavailable, the template is shown and labeled as a fallback. It can never approve a room.
                </Banner>
            ) : (
                <Banner tone="warning">
                    <strong>Local preview: template briefing.</strong> No AI model is called here. Inside ServiceNow the briefing is
                    written by an AI model on the server.
                </Banner>
            )}

            <section className="card" aria-labelledby="h-generate">
                <h2 id="h-generate">Generate a briefing</h2>
                <div className="handoff-controls">
                    <label className="field">
                        <span>Outgoing shift</span>
                        <select value={shift} onChange={(e) => isShift(e.target.value) && changeShift(e.target.value)}>
                            {SHIFT_ORDER.map((s) => (
                                <option key={s} value={s}>
                                    {SHIFT_LABEL[s]}
                                </option>
                            ))}
                        </select>
                    </label>
                    <p className="muted">Briefs the {SHIFT_LABEL[nextShift(shift)].toLowerCase()}.</p>
                    <button type="button" className="btn btn--primary" onClick={() => void generate()} aria-disabled={generation.status === 'loading'}>
                        <Icon name="sparkles" size={16} /> Generate briefing
                    </button>
                    {APP_MODE === 'demo' ? (
                        <label className="handoff-controls__demo">
                            <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
                            Preview: make generation fail
                        </label>
                    ) : null}
                </div>
            </section>

            <section aria-live="polite" aria-label="Briefing result">
                {generation.status === 'idle' ? (
                    <StateScreen
                        icon="sparkles"
                        title="No briefing yet"
                        message="Choose the outgoing shift and select Generate briefing."
                    />
                ) : null}

                {generation.status === 'loading' ? <LoadingState label={APP_MODE === 'servicenow' ? 'Writing the briefing (this can take a few seconds)' : 'Generating briefing'} /> : null}

                {generation.status === 'error' ? (
                    <StateScreen icon="alert" tone="danger" title="Briefing failed" message={generation.message}>
                        <button type="button" className="btn btn--primary" onClick={() => void generate()}>
                            Try again
                        </button>
                    </StateScreen>
                ) : null}

                {generation.status === 'ready' ? (
                    <div className="card">
                        <div className="card__head">
                            <h2>Briefing</h2>
                            <div className="copy-row">
                                <button type="button" className="btn btn--ghost btn--flat" onClick={() => void copyBriefing(generation.briefing)}>
                                    <Icon name="list" size={16} /> Copy briefing
                                </button>
                                <span role="status" className={copy === 'failed' ? 'copy-row__failed' : 'muted'}>
                                    {copy === 'copied' ? 'Copied to clipboard.' : null}
                                    {copy === 'failed' ? 'Could not copy automatically. Select the text and copy it manually.' : null}
                                </span>
                            </div>
                        </div>
                        <BriefingView briefing={generation.briefing} />
                    </div>
                ) : null}
            </section>
        </div>
    )
}
