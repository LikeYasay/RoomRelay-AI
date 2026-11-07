/**
 * Where the app is running.
 *   'servicenow'  inside the ServiceNow UI Page: real sign-in, data from the RoomRelay REST API
 *   'demo'        the local preview (npm run preview): staff accounts to pick from and an in-memory copy of the data
 */
export type AppMode = 'servicenow' | 'demo'

function detectMode(): AppMode {
    const host = window.location.hostname
    return host === 'localhost' || host === '127.0.0.1' ? 'demo' : 'servicenow'
}

export const APP_MODE: AppMode = detectMode()

/** ServiceNow's session token for this page, sent as X-UserToken on every API call (CSRF protection). */
export function sessionToken(): string | undefined {
    const token = (window as unknown as { g_ck?: unknown }).g_ck
    return typeof token === 'string' && token !== '' ? token : undefined
}

/**
 * Notes shown only in the local preview, so nobody mistakes the laptop copy for the live system.
 * Inside ServiceNow they are null and the screens show nothing extra.
 */
const LOCAL = APP_MODE === 'demo'
export const DATA_NOTE = {
    chip: LOCAL ? 'Local preview' : null,
    sidebar: LOCAL ? 'Local preview. Changes stay in this browser tab.' : null,
    changes: LOCAL ? 'Changes are kept in this browser tab only and are not saved to ServiceNow.' : null,
    audit: LOCAL
        ? 'In the local preview these entries come from the initial data and the changes made in this tab. Inside ServiceNow the server writes the log. Nobody can edit or delete an entry.'
        : 'Entries are written by the ServiceNow server in the same request as each change. Sign-ins are recorded by ServiceNow itself. Nobody can edit or delete an entry.',
}
