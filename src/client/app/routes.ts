import type { IconName } from '../components/ui/Icon'
import type { Role } from '../types/domain'

/**
 * Route table. `roles` controls which navigation items are enabled and which screen
 * is shown. This is a USABILITY aid only. Real authorization must be enforced by
 * ServiceNow roles, ACLs and server-side validation.
 */

export type RouteId = 'dashboard' | 'rooms' | 'housekeeping' | 'maintenance' | 'handoff'

export interface RouteDef {
    id: RouteId
    label: string
    title: string
    description: string
    icon: IconName
    roles: Role[]
    /** false means the screen is planned but not built yet. */
    live: boolean
    plannedPhase?: string
}

export const ROUTES: RouteDef[] = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        title: 'Operations Dashboard',
        description: 'Live view of room readiness, outstanding work and blockers.',
        icon: 'dashboard',
        roles: ['housekeeping', 'maintenance', 'supervisor', 'admin'],
        live: true,
    },
    {
        id: 'rooms',
        label: 'Room Readiness',
        title: 'Room Readiness Board',
        description: 'Every room with its housekeeping, inspection and readiness status.',
        icon: 'bed',
        roles: ['housekeeping', 'supervisor', 'admin'],
        live: true,
    },
    {
        id: 'housekeeping',
        label: 'Housekeeping',
        title: 'Housekeeping Management',
        description: 'Assigned tasks, priorities, progress and supervisor review.',
        icon: 'clipboard-check',
        roles: ['housekeeping', 'supervisor', 'admin'],
        live: true,
    },
    {
        id: 'maintenance',
        label: 'Maintenance',
        title: 'Maintenance and Defects',
        description: 'Defect reports, severity, blocking status and resolutions.',
        icon: 'wrench',
        roles: ['housekeeping', 'maintenance', 'supervisor', 'admin'],
        live: true,
    },
    {
        id: 'handoff',
        label: 'Shift Handoff',
        title: 'AI Shift Handoff Assistant',
        description: 'Generate a briefing for the incoming shift.',
        icon: 'sparkles',
        roles: ['supervisor'],
        live: true,
    },
]

export function findRoute(id: string): RouteDef | undefined {
    return ROUTES.find((r) => r.id === id)
}

export function canViewRoute(route: RouteDef, role: Role): boolean {
    return route.roles.includes(role)
}
