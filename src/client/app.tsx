import React, { useEffect } from 'react'
import { DataProvider } from './app/data'
import { useHashRoute } from './app/useHashRoute'
import { canViewRoute } from './app/routes'
import { SessionProvider, useAuth, useSession } from './app/session'
import { AppShell } from './components/layout/AppShell'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { StateScreen } from './components/ui/StateScreen'
import { AccessScreen } from './features/access/AccessScreen'
import { CreateAccountScreen } from './features/auth/CreateAccountScreen'
import { LoginScreen } from './features/auth/LoginScreen'
import { DashboardScreen } from './features/dashboard/DashboardScreen'
import { HandoffScreen } from './features/handoff/HandoffScreen'
import { HousekeepingScreen } from './features/housekeeping/HousekeepingScreen'
import { MaintenanceScreen } from './features/maintenance/MaintenanceScreen'
import { RoomBoardScreen } from './features/rooms/RoomBoardScreen'
import { RoomDetailScreen } from './features/rooms/RoomDetailScreen'
import { MockDataSource } from './services/mockDataSource'
import { loadBrandFont } from './styles/loadFonts'
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import './styles/dashboard.css'
import './styles/rooms.css'
import './styles/forms.css'
import './styles/handoff.css'
import './styles/auth.css'

loadBrandFont()

// The prototype uses the synthetic mock source. Phase 4 swaps in a ServiceNow-backed source.
const dataSource = new MockDataSource()

function Routes() {
    const { role } = useSession()
    const { route, param } = useHashRoute()

    if (!route) {
        return (
            <AppShell routeKey="not-found" activeRoute={undefined} title="Page not found" description="That page does not exist.">
                <StateScreen icon="search" title="Page not found" message="The page you asked for does not exist." tone="warning">
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
            <StateScreen icon="lock" tone="danger" title="Access denied" message="Your role does not include access to this page.">
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
        body = <AccessScreen />
    }

    return (
        <AppShell routeKey={`${route.id}/${param ?? ''}`} activeRoute={route.id} title={title} description={description}>
            {body}
        </AppShell>
    )
}

/** Signed out: only the sign-in and create-account pages exist. Signed in: the app. */
function Root() {
    const { account } = useAuth()
    const { page } = useHashRoute()

    // A signed-in person who opens the sign-in or sign-up address is sent to the dashboard.
    useEffect(() => {
        if (account && page) window.location.hash = '#/dashboard'
    }, [account, page])

    if (!account) return page === 'signup' ? <CreateAccountScreen /> : <LoginScreen />
    if (page) return null

    // Keyed by account so nothing loaded for one person is ever reused for the next.
    return (
        <DataProvider key={account.id} source={dataSource}>
            <Routes />
        </DataProvider>
    )
}

export default function App() {
    return (
        <ErrorBoundary>
            <SessionProvider>
                <Root />
            </SessionProvider>
        </ErrorBoundary>
    )
}
