import React, { useEffect, useMemo } from 'react'
import { CreateAccountScreen } from '../features/auth/CreateAccountScreen'
import { LoginScreen } from '../features/auth/LoginScreen'
import { ServerSessionProvider, SessionProvider, useAuth } from '../features/auth/session'
import { DataProvider } from './DataProvider'
import { MockDataSource } from '../mock/mockDataSource'
import { APP_MODE } from '../shared/api/environment'
import { ServiceNowDataSource } from '../shared/api/serviceNowDataSource'
import { ErrorBoundary } from '../shared/ui/ErrorBoundary'
import { LoadingState, StateScreen } from '../shared/ui/StateScreen'
import { AppRoutes } from './AppRoutes'
import { useHashRoute } from './useHashRoute'
import { loadBrandFont } from './styles/loadFonts'

// Styles, in cascade order. Global styles live in app/styles; each feature keeps its own
// stylesheet in its folder. They are imported here, in one place, because the order matters:
// responsive.css must come last so its media queries win.
import './styles/tokens.css'
import './styles/base.css'
import './styles/layout.css'
import './styles/components.css'
import '../features/dashboard/dashboard.css'
import '../features/rooms/rooms.css'
import '../features/maintenance/maintenance.css'
import '../features/activity/activity.css'
import './styles/forms.css'
import '../features/handoff/handoff.css'
import '../features/auth/auth.css'
import './styles/responsive.css'

loadBrandFont()

/**
 * Inside ServiceNow: the signed-in user and the RoomRelay REST API.
 * Local preview: demo sign-in pages and the in-memory demo store.
 */
function Root() {
    const { account, mode, status, error } = useAuth()
    const { page } = useHashRoute()

    // Both sources implement the same RoomRelayDataSource interface (shared/api/dataSource.ts).
    const dataSource = useMemo(
        () => (!account ? null : mode === 'servicenow' ? new ServiceNowDataSource() : new MockDataSource(account)),
        [account, mode]
    )

    // A signed-in person who opens the sign-in or sign-up address is sent to the dashboard.
    useEffect(() => {
        if (account && page) window.location.hash = '#/dashboard'
    }, [account, page])

    if (mode === 'servicenow' && (!account || !dataSource)) {
        return (
            <main id="main-content" className="standalone">
                {status === 'loading' ? (
                    <LoadingState label="Signing in" />
                ) : (
                    <StateScreen icon="lock" tone="danger" title="No access to RoomRelay" message={error ?? 'Your account could not be loaded.'} />
                )}
            </main>
        )
    }
    if (!account || !dataSource) return page === 'signup' ? <CreateAccountScreen /> : <LoginScreen />
    if (page) return null

    // Keyed by account so nothing loaded for one person is ever reused for the next.
    return (
        <DataProvider key={account.id} source={dataSource}>
            <AppRoutes />
        </DataProvider>
    )
}

export default function App() {
    return (
        <ErrorBoundary>
            {APP_MODE === 'servicenow' ? (
                <ServerSessionProvider>
                    <Root />
                </ServerSessionProvider>
            ) : (
                <SessionProvider>
                    <Root />
                </SessionProvider>
            )}
        </ErrorBoundary>
    )
}
