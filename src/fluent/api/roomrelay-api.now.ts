import '@servicenow/sdk/global'
import { Acl, RestApi } from '@servicenow/sdk/core'
import { getMe, getSnapshot, postBriefing, postCommand, postDemoReset } from '../../server/api/handlers'
import { ALL_APP_ROLES } from '../auth/roles.now'

/**
 * The RoomRelay REST API: /api/x_2305075_roomrela/v1/roomrelay/...
 * Only signed-in users with a RoomRelay role may call it (platform admins pass through the
 * admin override). Each handler then applies the role and ownership rules itself.
 *
 * The ACL is set on every route as well as on the API: a route's own setting overrides the API's,
 * and without it the SDK uses ServiceNow's 'Scripted REST External Default', which lets any
 * signed-in internal user through (found in the PDI on 2026-11-07).
 */
const apiAccess = Acl({
    $id: Now.ID['roomrelay-api-acl'],
    name: 'RoomRelay API',
    type: 'rest_endpoint',
    operation: 'execute',
    roles: ALL_APP_ROLES,
})

RestApi({
    $id: Now.ID['roomrelay-api'],
    name: 'RoomRelay API',
    serviceId: 'roomrelay',
    shortDescription: 'Rooms, tasks, defects and audit log for RoomRelay AI',
    consumes: 'application/json',
    produces: 'application/json',
    enforceAcl: [apiAccess],
    versions: [{ $id: Now.ID['roomrelay-api-v1'], version: 1, isDefault: true }],
    routes: [
        { $id: Now.ID['roomrelay-get-me'], name: 'me', method: 'GET', path: '/me', script: getMe, version: 1, enforceAcl: [apiAccess] },
        { $id: Now.ID['roomrelay-get-snapshot'], name: 'snapshot', method: 'GET', path: '/snapshot', script: getSnapshot, version: 1, enforceAcl: [apiAccess] },
        { $id: Now.ID['roomrelay-post-commands'], name: 'commands', method: 'POST', path: '/commands', script: postCommand, version: 1, enforceAcl: [apiAccess] },
        { $id: Now.ID['roomrelay-post-demo-reset'], name: 'demo reset', method: 'POST', path: '/demo/reset', script: postDemoReset, version: 1, enforceAcl: [apiAccess] },
        { $id: Now.ID['roomrelay-post-briefing'], name: 'briefing', method: 'POST', path: '/handoff/briefing', script: postBriefing, version: 1, enforceAcl: [apiAccess] },
    ],
})
