import React from 'react'
import { DataProvider } from './app/data'
import { useHashRoute } from './app/useHashRoute'
import { canViewRoute } from './app/routes'
import { SessionProvider, useSession } from './app/session'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { StateScreen } from './components/ui/StateScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { HandoffScreen } from './features/handoff/HandoffScreen'
import { HousekeepingScreen } from './features/housekeeping/HousekeepingScreen'
import { MaintenanceScreen } from './features/maintenance/MaintenanceScreen'
import { RoomBoardScreen } from './features/rooms/RoomBoardScreen'
import { RoomDetailScreen } from './features/rooms/RoomDetailScreen'
import { MockDataSource } from './services/mockDataSource'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/dashboard.css'
import './styles/rooms.css'
import './styles/forms.css'
import './styles/handoff.css'

// Phases 1 and 2 use the synthetic mock source. Phase 4 swaps in a ServiceNow-backed source.
const dataSource = new MockDataSource()

function Routes() {
    const { role } = useSession()
    const { route, param } = useHashRoute()

    if (!route) {
        return (
            <AppShell routeKey="not-found" activeRoute={undefined} title="Page not found" description="That page does not exist.">
                <StateScreen
                    icon="search"
                    title="Page not found"
                    message="The page you asked for does not exist."
                    tone="warning"
                >
                    <a className="btn btn--primary" href="#/dashboard">
                        Go to dashboard
                    </a>
                </StateScreen>
            </AppShell>
        )
    }

    let title = route.title
    let description = route.description
    let body: React.ReactNode

    if (!canViewRoute(route, role)) {
        // UI courtesy only. The server must still deny the underlying data and actions.
        body = (
            <StateScreen
                icon="lock"
                tone="danger"
                title="Access denied"
                message="Your role does not include access to this page."
            >
                <a className="btn btn--primary" href="#/dashboard">
                    Back to dashboard
                </a>
            </StateScreen>
        )
    } else if (route.id === 'dashboard') {
        body = <DashboardScreen />
    } else if (route.id === 'rooms' && param === undefined) {
        body = <RoomBoardScreen />
    } else if (route.id === 'rooms') {
        title = /^\d{3,4}$/.test(param ?? '') ? `Room ${param}` : 'Room details'
        description = 'Readiness, checklist, defects and activity for one room.'
        body = <RoomDetailScreen roomId={param} />
    } else if (route.id === 'housekeeping') {
        body = <HousekeepingScreen />
    } else if (route.id === 'maintenance') {
        body = <MaintenanceScreen />
    } else if (route.id === 'handoff') {
        body = <HandoffScreen />
    } else {
        body = (
            <StateScreen
                icon="clock"
                title={`${route.title} is planned`}
                message={`This screen is scheduled for ${route.plannedPhase ?? 'a later phase'} and is not built yet.`}
            >
                <a className="btn btn--primary" href="#/dashboard">
                    Back to dashboard
                </a>
            </StateScreen>
        )
    }

    return (
        <AppShell routeKey={`${route.id}/${param ?? ''}`} activeRoute={route.id} title={title} description={description}>
            {body}
        </AppShell>
    )
}

export default function App() {
    return (
        <ErrorBoundary>
            <SessionProvider>
                <DataProvider source={dataSource}>
                    <Routes />
                </DataProvider>
            </SessionProvider>
        </ErrorBoundary>
    )
}
