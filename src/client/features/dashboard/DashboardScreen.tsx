import React, { useMemo, useState } from 'react'
import { DataGate } from '../../app/data'
import type { ReadyData } from '../../app/data'
import {
    computeKpis,
    floorBreakdown,
    highPriorityBlockers,
    recentActivity,
    shiftOverview,
} from '../../domain/selectors'
import { KpiCard } from '../../components/ui/KpiCard'
import { EmptyState } from '../../components/ui/StateScreen'
import { ActivityFeed } from './ActivityFeed'
import { AttentionTable } from './AttentionTable'
import { BlockersPanel } from './BlockersPanel'
import { FloorBars } from './FloorBars'
import { ShiftOverview } from './ShiftOverview'
import { StatusBreakdown } from './StatusBreakdown'
import { StatusLegend } from './StatusLegend'

/** Loading and error states live in DataGate; the page only renders once data is ready. */
export function DashboardScreen() {
    return <DataGate loadingLabel="Loading operations data">{(data) => <DashboardPage data={data} />}</DataGate>
}

function DashboardPage({ data }: { data: ReadyData }) {
    const { snapshot, scoped } = data
    const [floor, setFloor] = useState<'all' | number>('all')

    const floors = useMemo(() => [...new Set(scoped.views.map((v) => v.room.floor))].sort((a, b) => a - b), [scoped])

    // If the previously selected floor is not in this role's scope, fall back to all floors.
    const activeFloor = floor !== 'all' && floors.includes(floor) ? floor : 'all'
    const views = useMemo(
        () => (activeFloor === 'all' ? scoped.views : scoped.views.filter((v) => v.room.floor === activeFloor)),
        [scoped, activeFloor]
    )

    const kpis = useMemo(() => computeKpis(views), [views])
    const floorData = useMemo(() => floorBreakdown(views), [views])
    const shifts = useMemo(() => shiftOverview(views, snapshot.staff), [views, snapshot.staff])
    const blockers = useMemo(() => highPriorityBlockers(views, snapshot.staff), [views, snapshot.staff])
    const activity = useMemo(() => recentActivity(views, snapshot.staff), [views, snapshot.staff])

    if (scoped.views.length === 0) {
        return <EmptyState title="No rooms to show" message="No rooms are currently assigned to you." />
    }

    return (
        <div className="dashboard">
            <div className="dashboard__filters">
                <p className="muted">
                    {scoped.note} Every number is calculated from one synthetic dataset; no ServiceNow records are read or changed.
                </p>
                <label className="field">
                    <span>Floor</span>
                    <select
                        value={String(activeFloor)}
                        onChange={(e) => setFloor(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">All floors</option>
                        {floors.map((f) => (
                            <option key={f} value={f}>
                                Floor {f}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <section aria-label="Key figures" className="kpis">
                <KpiCard label="Total rooms" value={kpis.totalRooms} />
                <KpiCard label="Ready" value={kpis.byStatus.ready} hint={`${kpis.readyPercent}% of rooms`} tone="success" />
                <KpiCard label="Needs cleaning" value={kpis.byStatus.needs_cleaning} tone="warning" />
                <KpiCard label="In progress" value={kpis.byStatus.in_progress} tone="info" />
                <KpiCard label="Pending inspection" value={kpis.byStatus.pending_inspection} tone="review" />
                <KpiCard label="Blocked" value={kpis.byStatus.blocked} tone="danger" />
                <KpiCard label="Outstanding tasks" value={kpis.openTasks} hint={`${kpis.openMandatoryTasks} mandatory`} tone="warning" />
                <KpiCard
                    label="Unresolved defects"
                    value={kpis.unresolvedDefects}
                    hint={`${kpis.unresolvedBlockingDefects} blocking readiness`}
                    tone="warning"
                />
                <KpiCard label="High-priority blockers" value={kpis.highPriorityBlockers} hint="High or critical severity" tone="danger" />
            </section>

            <div className="dashboard__layout">
                <div className="dashboard__main">
                    <div className="grid grid--2">
                        <section className="card" aria-labelledby="h-status">
                            <h2 id="h-status">Rooms by status</h2>
                            <StatusBreakdown kpis={kpis} />
                        </section>
                        <section className="card" aria-labelledby="h-floors">
                            <h2 id="h-floors">Readiness by floor</h2>
                            <FloorBars floors={floorData} />
                            <StatusLegend />
                        </section>
                    </div>

                    <section className="card" aria-labelledby="h-attention">
                        <h2 id="h-attention">Rooms needing attention</h2>
                        <AttentionTable views={views} />
                    </section>
                </div>

                <div className="dashboard__rail">
                    <section className="card" aria-labelledby="h-blockers">
                        <h2 id="h-blockers">High-priority blockers</h2>
                        <BlockersPanel blockers={blockers} nowIso={snapshot.generatedAt} />
                    </section>
                    <section className="card" aria-labelledby="h-shifts">
                        <h2 id="h-shifts">Shift readiness</h2>
                        <ShiftOverview shifts={shifts} />
                    </section>
                    <section className="card" aria-labelledby="h-activity">
                        <h2 id="h-activity">Recent room activity</h2>
                        <ActivityFeed entries={activity} nowIso={snapshot.generatedAt} />
                    </section>
                </div>
            </div>
        </div>
    )
}
