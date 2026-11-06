import React from 'react'
import { ROUTES, canViewRoute } from '../../app/routes'
import type { RouteId } from '../../app/routes'
import type { Role } from '../../types/domain'
import { Icon } from '../ui/Icon'

interface SidebarProps {
    activeRoute: RouteId | undefined
    role: Role
    open: boolean
    onNavigate: () => void
}

export function Sidebar({ activeRoute, role, open, onNavigate }: SidebarProps) {
    return (
        <aside id="app-sidebar" className={`sidebar${open ? ' sidebar--open' : ''}`}>
            <div className="sidebar__brand">
                <span className="sidebar__logo" aria-hidden="true">
                    <Icon name="building" size={22} />
                </span>
                <div>
                    <p className="sidebar__name">RoomRelay AI</p>
                    <p className="sidebar__tagline">Room readiness and shift handoff</p>
                </div>
            </div>

            <nav aria-label="Main navigation">
                <ul className="nav">
                    {ROUTES.map((route) => {
                        const allowed = canViewRoute(route, role)
                        const active = route.id === activeRoute
                        if (!allowed) {
                            return (
                                <li key={route.id}>
                                    <span className="nav__item nav__item--disabled" aria-disabled="true">
                                        <Icon name={route.icon} />
                                        <span className="nav__label">{route.label}</span>
                                        <span className="nav__tag">
                                            <Icon name="lock" size={12} /> Restricted
                                        </span>
                                    </span>
                                </li>
                            )
                        }
                        return (
                            <li key={route.id}>
                                <a
                                    className={`nav__item${active ? ' nav__item--active' : ''}`}
                                    href={`#/${route.id}`}
                                    aria-current={active ? 'page' : undefined}
                                    onClick={onNavigate}
                                >
                                    <Icon name={route.icon} />
                                    <span className="nav__label">{route.label}</span>
                                    {route.live ? null : <span className="nav__tag">Planned</span>}
                                </a>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            <p className="sidebar__footer">Prototype build. Synthetic data only.</p>
        </aside>
    )
}
