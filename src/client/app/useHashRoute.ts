import { useEffect, useState } from 'react'
import { parseHash } from './parseHash'
import type { ParsedRoute } from './parseHash'

export type { ParsedRoute, PublicPage } from './parseHash'

export function useHashRoute(): ParsedRoute {
    const [hash, setHash] = useState(() => window.location.hash)

    useEffect(() => {
        const onChange = () => setHash(window.location.hash)
        window.addEventListener('hashchange', onChange)
        return () => window.removeEventListener('hashchange', onChange)
    }, [])

    return parseHash(hash)
}
