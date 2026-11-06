import React, { useEffect, useRef, useState } from 'react'
import { DataGate } from '../../app/data'
import type { ReadyData } from '../../app/data'
import { briefingToText, buildSimulatedBriefing, nextShift } from '../../domain/handoff'
import type { Briefing } from '../../domain/handoff'
import { SHIFT_LABEL } from '../../domain/labels'
import { SHIFT_ORDER } from '../../domain/selectors'
import type { Shift } from '../../types/domain'
import { Banner } from '../../components/ui/Banner'
import { Icon } from '../../components/ui/Icon'
import { LoadingState, StateScreen } from '../../components/ui/StateScreen'
import { BriefingView } from './BriefingView'

const SIMULATED_DELAY_MS = 1200

type Generation =
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'ready'; briefing: Briefing }
    | { status: 'error'; message: string }

type CopyState = 'idle' | 'copied' | 'failed'

const isShift = (v: string): v is Shift => (SHIFT_ORDER as string[]).includes(v)

export function HandoffScreen() {
    return <DataGate loadingLabel="Loading shift data">{(data) => <Handoff data={data} />}</DataGate>
}

function Handoff({ data }: { data: ReadyData }) {
    const [shift, setShift] = useState<Shift>('morning')
    const [simulateFailure, setSimulateFailure] = useState(false)
    const [generation, setGeneration] = useState<Generation>({ status: 'idle' })
    const [copy, setCopy] = useState<CopyState>('idle')
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Cancel any pending simulated generation when leaving the screen.
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current)
    }, [])

    const changeShift = (next: Shift) => {
        if (timer.current) clearTimeout(timer.current)
        setShift(next)
        setGeneration({ status: 'idle' })
        setCopy('idle')
    }

    const generate = () => {
        if (generation.status === 'loading') return // ignore duplicate clicks while one is running
        if (timer.current) clearTimeout(timer.current)
        setGeneration({ status: 'loading' })
        setCopy('idle')
        timer.current = setTimeout(() => {
            if (simulateFailure) {
                setGeneration({
                    status: 'error',
                    message: 'The briefing could not be generated. No briefing was produced. Please try again.',
                })
                return
            }
            setGeneration({
                status: 'ready',
                briefing: buildSimulatedBriefing(data.scoped.views, shift, new Date().toISOString()),
            })
        }, SIMULATED_DELAY_MS)
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
            <Banner tone="warning">
                <strong>Prototype: simulated briefing.</strong> No AI model is connected yet. The text is produced by a local
                template from the synthetic data. A real, server-side AI integration comes in a later phase.
            </Banner>

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
                    <button type="button" className="btn btn--primary" onClick={generate} aria-disabled={generation.status === 'loading'}>
                        <Icon name="sparkles" size={16} /> Generate briefing
                    </button>
                    <label className="handoff-controls__demo">
                        <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} />
                        Demo: make generation fail
                    </label>
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

                {generation.status === 'loading' ? <LoadingState label="Generating simulated briefing" /> : null}

                {generation.status === 'error' ? (
                    <StateScreen icon="alert" tone="danger" title="Briefing failed" message={generation.message}>
                        <button type="button" className="btn btn--primary" onClick={generate}>
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
