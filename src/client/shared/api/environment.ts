/**
 * Where the app is running.
 *   'servicenow'  inside the ServiceNow UI Page: real sign-in, data from the RoomRelay REST API
 *   'demo'        the local preview (npm run preview): demo accounts and the in-memory demo store
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

/** Short notes shown on screens so nobody mistakes demo data for real records. */
export const DATA_NOTE = {
    chip: APP_MODE === 'servicenow' ? 'Demo data in ServiceNow' : 'Prototype: synthetic data',
    sidebar: APP_MODE === 'servicenow' ? 'Connected to ServiceNow. Demo data.' : 'Prototype build. Synthetic data only.',
    dashboard:
        APP_MODE === 'servicenow'
            ? 'Every number is calculated from the RoomRelay records in ServiceNow (demo data).'
            : 'Every number is calculated from one synthetic dataset kept in this browser tab; no ServiceNow records are read or changed.',
    changes:
        APP_MODE === 'servicenow'
            ? 'Changes are saved to ServiceNow and recorded in the audit log. The data is a demo dataset that the administrator can reset.'
            : 'Changes are kept in this browser tab only and are not saved to ServiceNow. Reload the page or use Prototype tools to reset.',
    audit:
        APP_MODE === 'servicenow'
            ? 'Entries are written by the ServiceNow server in the same request as each change. Sign-ins are recorded by ServiceNow itself. Nobody can edit or delete an entry.'
            : 'These entries are generated from the synthetic data and from changes made in this browser tab. In the live system the ServiceNow server writes the log, and sign-ins are recorded by ServiceNow itself. Nobody can edit or delete an entry.',
}
