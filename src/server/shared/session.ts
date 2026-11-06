import { gs, GlideRecord } from '@servicenow/glide'
import type { Role, Shift, Staff } from '../../client/shared/domain/types'
import { ROLE_NAMES, TABLES } from './tables'

/**
 * Who is calling, and who the staff are. Identity always comes from the ServiceNow session
 * (gs.getUserID), never from the request, and the role from the user's assigned roles.
 */

// If someone holds several RoomRelay roles, the first one in this list wins.
const PRECEDENCE: Role[] = ['admin', 'supervisor', 'maintenance', 'housekeeping']
const ROLE_BY_NAME: Record<string, Role> = Object.fromEntries(Object.entries(ROLE_NAMES).map(([role, name]) => [name, role as Role]))

/** Every user holding a RoomRelay role, with their name and shift. */
export function loadStaff(): Staff[] {
    const rolesByUser = new Map<string, Role[]>()
    const names = new Map<string, string>()
    const assignments = new GlideRecord('sys_user_has_role')
    assignments.addQuery('role.name', 'IN', Object.values(ROLE_NAMES).join(','))
    assignments.addQuery('user.active', true)
    assignments.query()
    while (assignments.next()) {
        const userId = assignments.getValue('user')
        const role = ROLE_BY_NAME[assignments.getDisplayValue('role')]
        if (!userId || !role) continue
        rolesByUser.set(userId, [...(rolesByUser.get(userId) ?? []), role])
        names.set(userId, assignments.getDisplayValue('user'))
    }

    // Shifts come from the optional staff profile; default to morning.
    const shifts = new Map<string, Shift>()
    const profiles = new GlideRecord(TABLES.staff)
    profiles.query()
    while (profiles.next()) shifts.set(profiles.getValue('user'), (profiles.getValue('shift') || 'morning') as Shift)

    return [...rolesByUser.entries()]
        .map(([id, roles]) => ({
            id,
            name: names.get(id) ?? 'Unknown',
            role: PRECEDENCE.find((r) => roles.includes(r)) as Role,
            shift: shifts.get(id) ?? 'morning',
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * The signed-in user as RoomRelay staff, or null if they have no RoomRelay role.
 * A platform administrator without an app role is treated as the RoomRelay administrator.
 */
export function currentStaff(staff: Staff[]): Staff | null {
    const userId = gs.getUserID()
    const found = staff.find((s) => s.id === userId)
    if (found) return found
    if (gs.hasRole('admin')) return { id: userId, name: gs.getUserDisplayName(), role: 'admin', shift: 'morning' }
    return null
}
