import { GlideDateTime } from '@servicenow/glide'

/**
 * The app uses ISO strings in UTC ("2026-11-06T14:30:00.000Z"); ServiceNow stores date/time
 * values in UTC as "2026-11-06 14:30:00". These helpers convert between the two.
 */

export function fromGlide(value: string | null | undefined): string | undefined {
    if (!value) return undefined
    return `${value.replace(' ', 'T')}.000Z`
}

export function toGlide(iso: string | undefined): string {
    if (!iso) return ''
    return iso.slice(0, 19).replace('T', ' ')
}

/** "Now" in the app's ISO format. GlideDateTime.getValue() is always UTC. */
export function nowIso(): string {
    return fromGlide(new GlideDateTime().getValue()) as string
}
