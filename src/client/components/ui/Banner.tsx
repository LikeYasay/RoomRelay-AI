import React from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'

interface BannerProps {
    tone?: 'info' | 'warning' | 'danger'
    children: ReactNode
}

export function Banner({ tone = 'info', children }: BannerProps) {
    return (
        <div className={`banner banner--${tone}`} role={tone === 'danger' ? 'alert' : 'note'}>
            <Icon name={tone === 'info' ? 'info' : 'alert-small'} size={18} />
            <div>{children}</div>
        </div>
    )
}
