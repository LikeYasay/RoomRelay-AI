import React from 'react'
import { useSession } from '../../app/session'
import { ROLE_LABEL } from '../../domain/labels'
import { Icon } from '../ui/Icon'
import { DemoControls } from './DemoControls'

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
            <div className="header__top">
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
                    <span className="header__who">
                        <Icon name="user" size={16} />
                        <span>
                            {user.name} <span className="muted">({ROLE_LABEL[role]})</span>
                        </span>
                    </span>
                </div>
            </div>
            <DemoControls />
        </header>
    )
}
