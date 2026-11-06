import React from 'react'
import { ICON_PATHS } from './iconPaths'
import type { IconName } from './iconPaths'

export type { IconName } from './iconPaths'

interface IconProps {
    name: IconName
    size?: number
    className?: string
}

/** Inline SVG icons (no icon library). Decorative by default; pair with visible text. */
export function Icon({ name, size = 20, className }: IconProps) {
    return (
        <svg
            className={className}
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            <path d={ICON_PATHS[name]} />
        </svg>
    )
}
