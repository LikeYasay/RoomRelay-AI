import React, { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { RouteId } from '../routes'
import { useSession } from '../../features/auth/session'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

interface AppShellProps {
    /** Changes on every navigation, so keyboard and screen-reader focus can move to the new content. */
    routeKey: string
    activeRoute: RouteId | undefined
    title: string
    description: string
    children: ReactNode
}

export function AppShell({ routeKey, activeRoute, title, description, children }: AppShellProps) {
    const { role } = useSession()
    const [menuOpen, setMenuOpen] = useState(false)
    const mainRef = useRef<HTMLElement>(null)
    const firstRender = useRef(true)

    // After navigating, move focus to the main content (skipped on first load).
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false
            return
        }
        mainRef.current?.focus()
    }, [routeKey])

    // Escape closes the mobile navigation drawer.
    useEffect(() => {
        if (!menuOpen) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setMenuOpen(false)
        }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [menuOpen])

    return (
        <div className="shell">
            {/* Navy strip behind the sidebar for the whole page height, so a whole-page capture is not cut off. */}
            <div className="shell__rail" aria-hidden="true" />
            {/* Moves focus only. A normal "#main-content" link would change the address and the hash router would
                treat it as an unknown page. */}
            <a
                className="skip-link"
                href="#main-content"
                onClick={(e) => {
                    e.preventDefault()
                    mainRef.current?.focus()
                }}
            >
                Skip to main content
            </a>
            <Sidebar activeRoute={activeRoute} role={role} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
            {menuOpen ? <div className="shell__scrim" onClick={() => setMenuOpen(false)} aria-hidden="true" /> : null}
            <div className="shell__main">
                <Header
                    title={title}
                    description={description}
                    menuOpen={menuOpen}
                    onToggleMenu={() => setMenuOpen((o) => !o)}
                />
                <main id="main-content" className="content" tabIndex={-1} ref={mainRef}>
                    {children}
                </main>
            </div>
        </div>
    )
}
