import React from 'react'
import { AccessScreen } from '../features/access/AccessScreen'
import { AuditLogScreen } from '../features/activity/AuditLogScreen'
import { useSession } from '../features/auth/session'
import { DashboardScreen } from '../features/dashboard/DashboardScreen'
import { HandoffScreen } from '../features/handoff/HandoffScreen'
import { MaintenanceScreen } from '../features/maintenance/MaintenanceScreen'
import { RoomDetailScreen } from '../features/rooms/RoomDetailScreen'
import { RoomsScreen } from '../features/rooms/RoomsScreen'
import { StateScreen } from '../shared/ui/StateScreen'
import { AppShell } from './layout/AppShell'
import { canViewRoute } from './routes'
import { useHashRoute } from './useHashRoute'

/** Maps the current address (#/dashboard, #/rooms/305, ...) to the screen of the feature that owns it. */
export function AppRoutes() {
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
        body = <RoomsScreen />
    } else if (route.id === 'rooms') {
        title = /^\d{3,4}$/.test(param ?? '') ? `Room ${param}` : 'Room details'
        description = 'Readiness, checklist, defects and activity for one room.'
        body = <RoomDetailScreen roomId={param} />
    } else if (route.id === 'maintenance') {
        body = <MaintenanceScreen defectId={param} />
    } else if (route.id === 'handoff') {
        body = <HandoffScreen />
    } else if (route.id === 'audit') {
        body = <AuditLogScreen />
    } else {
        body = <AccessScreen />
    }

    return (
        <AppShell routeKey={`${route.id}/${param ?? ''}`} activeRoute={route.id} title={title} description={description}>
            {body}
        </AppShell>
    )
}
