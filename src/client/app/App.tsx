import React, { useEffect, useMemo } from 'react'
import { CreateAccountScreen } from '../features/auth/CreateAccountScreen'
import { LoginScreen } from '../features/auth/LoginScreen'
import { SessionProvider, useAuth } from '../features/auth/session'
import { DataProvider } from './DataProvider'
import { MockDataSource } from '../mock/mockDataSource'
import { ErrorBoundary } from '../shared/ui/ErrorBoundary'
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

/** Signed out: only the sign-in and create-account pages exist. Signed in: the app. */
function Root() {
    const { account } = useAuth()
    const { page } = useHashRoute()

    // The prototype uses the in-memory demo source for the signed-in demo account. Phase 4 swaps in a
    // server-backed source that implements the same RoomRelayDataSource interface (shared/api/dataSource.ts).
    const dataSource = useMemo(() => (account ? new MockDataSource(account) : null), [account])

    // A signed-in person who opens the sign-in or sign-up address is sent to the dashboard.
    useEffect(() => {
        if (account && page) window.location.hash = '#/dashboard'
    }, [account, page])

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
            <SessionProvider>
                <Root />
            </SessionProvider>
        </ErrorBoundary>
    )
}
