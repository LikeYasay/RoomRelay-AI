import { useEffect, useState } from 'react'
import { findRoute } from './routes'
import type { RouteDef } from './routes'

export type PublicPage = 'login' | 'signup'

export interface ParsedRoute {
    route: RouteDef | undefined
    /** Raw second path segment, for example a room number. Validate before use. */
    param: string | undefined
    /** Set for the sign-in and create-account pages, which are not part of the signed-in app. */
    page: PublicPage | undefined
}

/** Only whitelisted route ids resolve. Anything else becomes "not found". */
export function parseHash(hash: string): ParsedRoute {
    const cleaned = hash.replace(/^#\/?/, '')
    if (cleaned === '') return { route: findRoute('dashboard'), param: undefined, page: undefined }
    const [first = '', second] = cleaned.split('/')
    if (first === 'login' || first === 'signup') return { route: undefined, param: undefined, page: first }
    return { route: findRoute(first), param: second ? decodeURIComponentSafe(second) : undefined, page: undefined }
}

function decodeURIComponentSafe(value: string): string | undefined {
    try {
        return decodeURIComponent(value).slice(0, 40)
    } catch {
        return undefined
    }
}

export function useHashRoute(): ParsedRoute {
    const [hash, setHash] = useState(() => window.location.hash)

    useEffect(() => {
        const onChange = () => setHash(window.location.hash)
        window.addEventListener('hashchange', onChange)
        return () => window.removeEventListener('hashchange', onChange)
    }, [])

    return parseHash(hash)
}
