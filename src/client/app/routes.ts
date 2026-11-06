import type { IconName } from '../shared/ui/iconPaths'
import type { Role } from '../shared/domain/types'

/**
 * Route table. `roles` controls which navigation items are enabled and which screen
 * is shown. This is a USABILITY aid only. Real authorization must be enforced by
 * ServiceNow roles, ACLs and server-side validation.
 */

export type RouteId = 'dashboard' | 'rooms' | 'maintenance' | 'handoff' | 'access' | 'audit'

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
        label: 'Rooms',
        title: 'Rooms',
        description: 'Cleaning, inspection and readiness for every room, with its housekeeping checklist.',
        icon: 'bed',
        roles: ['housekeeping', 'supervisor', 'admin'],
        live: true,
    },
    {
        id: 'maintenance',
        label: 'Maintenance',
        title: 'Maintenance and Defects',
        description: 'Defect reports, triage, priority and repairs.',
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
    {
        id: 'access',
        label: 'Users and Access',
        title: 'Users and Access',
        description: 'Staff accounts, access requests and role permissions.',
        icon: 'users',
        roles: ['admin'],
        live: true,
    },
    {
        id: 'audit',
        label: 'Audit Log',
        title: 'Audit Log',
        description: 'Who changed what, and when. Read-only.',
        icon: 'list',
        roles: ['admin'],
        live: true,
    },
]

export function findRoute(id: string): RouteDef | undefined {
    return ROUTES.find((r) => r.id === id)
}

export function canViewRoute(route: RouteDef, role: Role): boolean {
    return route.roles.includes(role)
}
