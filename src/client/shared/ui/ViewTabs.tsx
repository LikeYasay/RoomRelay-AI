import React, { useRef } from 'react'

export interface ViewTab<T extends string> {
    id: T
    label: string
    /** Optional count shown after the label, for example a queue size. */
    count?: number
}

interface ViewTabsProps<T extends string> {
    /** Accessible name of the tab list, for example "Room views". */
    label: string
    /** Prefix for element ids; must be unique on the page. */
    idPrefix: string
    tabs: Array<ViewTab<T>>
    active: T
    onChange: (id: T) => void
}

/** Ids that connect the tabs to the panel they control. */
export function tabPanelProps(idPrefix: string, active: string) {
    return { role: 'tabpanel' as const, id: `${idPrefix}-panel`, 'aria-labelledby': `${idPrefix}-tab-${active}`, tabIndex: 0 }
}

/**
 * Pre-built views of the same data, shown as tabs (WAI-ARIA tabs pattern):
 * arrow keys move between tabs, Home and End jump to the first and last.
 */
export function ViewTabs<T extends string>({ label, idPrefix, tabs, active, onChange }: ViewTabsProps<T>) {
    const refs = useRef<Array<HTMLButtonElement | null>>([])

    const focusTab = (index: number) => {
        const tab = tabs[(index + tabs.length) % tabs.length]
        if (!tab) return
        onChange(tab.id)
        refs.current[(index + tabs.length) % tabs.length]?.focus()
    }

    const onKeyDown = (e: React.KeyboardEvent, index: number) => {
        if (e.key === 'ArrowRight') focusTab(index + 1)
        else if (e.key === 'ArrowLeft') focusTab(index - 1)
        else if (e.key === 'Home') focusTab(0)
        else if (e.key === 'End') focusTab(tabs.length - 1)
        else return
        e.preventDefault()
    }

    return (
        <div className="view-tabs" role="tablist" aria-label={label}>
            {tabs.map((tab, i) => {
                const selected = tab.id === active
                return (
                    <button
                        key={tab.id}
                        ref={(el) => {
                            refs.current[i] = el
                        }}
                        type="button"
                        role="tab"
                        id={`${idPrefix}-tab-${tab.id}`}
                        aria-selected={selected}
                        aria-controls={`${idPrefix}-panel`}
                        tabIndex={selected ? 0 : -1}
                        className="view-tabs__tab"
                        onClick={() => onChange(tab.id)}
                        onKeyDown={(e) => onKeyDown(e, i)}
                    >
                        {tab.label}
                        {tab.count !== undefined ? <span className="view-tabs__count">{tab.count}</span> : null}
                    </button>
                )
            })}
        </div>
    )
}
