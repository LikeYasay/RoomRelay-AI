import React from 'react'
import { useSession } from '../../features/auth/session'
import { ROLE_LABEL } from '../../shared/domain/labels'
import { Icon } from '../../shared/ui/Icon'

interface HeaderProps {
    title: string
    description: string
    menuOpen: boolean
    onToggleMenu: () => void
}

export function Header({ title, description, menuOpen, onToggleMenu }: HeaderProps) {
    const { role, user } = useSession()

    return (
        <header className="header">
            <button
                type="button"
                className="icon-btn header__menu"
                onClick={onToggleMenu}
                aria-expanded={menuOpen}
                aria-controls="app-sidebar"
                aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
                <Icon name={menuOpen ? 'close' : 'menu'} />
            </button>

            <div className="header__titles">
                <h1>{title}</h1>
                <p>{description}</p>
            </div>

            <div className="header__user">
                <span className="chip chip--prototype">Prototype: synthetic data</span>
                <div className="header__who">
                    <p className="header__name">{user.name}</p>
                    <p className="header__role">{ROLE_LABEL[role]}</p>
                </div>
            </div>
        </header>
    )
}
