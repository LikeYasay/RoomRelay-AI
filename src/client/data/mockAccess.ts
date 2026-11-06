import type { Role, Shift } from '../types/domain'

/** SYNTHETIC pending access requests for the prototype Users and Access screen. All fictional. */
export interface AccessRequest {
    id: string
    fullName: string
    email: string
    role: Role
    shift: Shift
    reason: string
    submittedMinutesAgo: number
}

export const PENDING_REQUESTS: AccessRequest[] = [
    {
        id: 'req-1',
        fullName: 'Jamie Ortiz',
        email: 'jamie.ortiz@example.com',
        role: 'housekeeping',
        shift: 'afternoon',
        reason: 'New hire on floors 3 and 4, starting Monday.',
        submittedMinutesAgo: 95,
    },
    {
        id: 'req-2',
        fullName: 'Nadia Hussein',
        email: 'nadia.hussein@example.com',
        role: 'maintenance',
        shift: 'night',
        reason: 'Covering night-shift repairs while Daniel is on leave.',
        submittedMinutesAgo: 1560,
    },
]
