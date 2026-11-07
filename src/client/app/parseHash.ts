import { findRoute } from './routes'
import type { RouteDef } from './routes'

/** Turns the address bar hash into a route. Pure logic, no React, so it can be tested on its own. */

export type PublicPage = 'login'

export interface ParsedRoute {
    route: RouteDef | undefined
    /** Raw second path segment, for example a room number. Validate before use. */
    param: string | undefined
    /** Set for the sign-in page (local preview), which is not part of the signed-in app. */
    page: PublicPage | undefined
}

/** Old addresses that still work. The Housekeeping page was merged into Rooms. */
const ALIASES: Record<string, string> = { housekeeping: 'rooms' }

/** Only whitelisted route ids resolve. Anything else becomes "not found". */
export function parseHash(hash: string): ParsedRoute {
    const cleaned = hash.replace(/^#\/?/, '')
    if (cleaned === '') return { route: findRoute('dashboard'), param: undefined, page: undefined }
    const [first = '', second] = cleaned.split('/')
    if (first === 'login') return { route: undefined, param: undefined, page: first }
    const id = Object.prototype.hasOwnProperty.call(ALIASES, first) ? (ALIASES[first] as string) : first
    return { route: findRoute(id), param: second ? decodeURIComponentSafe(second) : undefined, page: undefined }
}

function decodeURIComponentSafe(value: string): string | undefined {
    try {
        return decodeURIComponent(value).slice(0, 40)
    } catch {
        return undefined
    }
}
