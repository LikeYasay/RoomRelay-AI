import React from 'react'
import { ROUTES, canViewRoute } from '../../app/routes'
import type { RouteId } from '../../app/routes'
import { useSession } from '../../app/session'
import type { Role } from '../../types/domain'
import { Icon } from '../ui/Icon'
import { PrototypeTools } from './PrototypeTools'

interface SidebarProps {
    activeRoute: RouteId | undefined
    role: Role
    open: boolean
    onNavigate: () => void
}

export function Sidebar({ activeRoute, role, open, onNavigate }: SidebarProps) {
    const { signOut } = useSession()

    // Pages this role cannot use are not listed at all. (Typing the address still shows "Access denied",
    // and the server must refuse the data regardless of what the menu shows.)
    const items = ROUTES.filter((route) => canViewRoute(route, role))

    return (
        <aside id="app-sidebar" className={`sidebar${open ? ' sidebar--open' : ''}`}>
            <div className="sidebar__brand">
                <span className="brand">RoomRelay AI</span>
                <span className="sidebar__tagline">Room readiness and shift handoff</span>
            </div>

            <nav aria-label="Main navigation">
                <ul className="nav">
                    {items.map((route) => {
                        const active = route.id === activeRoute
                        return (
                            <li key={route.id}>
                                <a
                                    className={`nav__item${active ? ' nav__item--active' : ''}`}
                                    href={`#/${route.id}`}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={onNavigate}
                                >
                                    <Icon name={route.icon} size={18} />
                                    <span>{route.label}</span>
                                </a>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <div className="sidebar__footer">
                <PrototypeTools />
                <p className="sidebar__note">Prototype build. Synthetic data only.</p>
                <button type="button" className="sidebar__signout" onClick={() => signOut()}>
                    <Icon name="logout" size={18} />
                    <span>Sign out</span>
                </button>
            </div>
        </aside>
    )
}
