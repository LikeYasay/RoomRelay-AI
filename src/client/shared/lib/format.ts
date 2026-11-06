/** Relative time such as "35 min ago". `nowIso` is the snapshot time, so output is stable and testable. */
export function formatAgo(iso: string, nowIso: string): string {
    const diffMin = Math.max(0, Math.round((Date.parse(nowIso) - Date.parse(iso)) / 60_000))
    if (Number.isNaN(diffMin)) return 'unknown time'
    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin} min ago`
    const hours = Math.floor(diffMin / 60)
    if (hours < 24) return `${hours} h ago`
    return `${Math.floor(hours / 24)} d ago`
}

export function formatDateTime(iso: string): string {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return 'unknown'
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : pluralForm}`
}

export function capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1)
}

export function percent(part: number, total: number): number {
    return total === 0 ? 0 : Math.round((part / total) * 100)
}
