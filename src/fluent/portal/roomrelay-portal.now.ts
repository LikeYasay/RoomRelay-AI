import '@servicenow/sdk/global'
import { ServicePortal, SPAngularProvider, SPPage, SPWidget } from '@servicenow/sdk/core'
import { ALL_APP_ROLES, housekeeperRole, supervisorRole } from '../auth/roles.now'

/**
 * The RoomRelay Service Portal: https://<instance>.service-now.com/roomrelay
 *
 * One page with three widgets. They sit beside the full app (the React UI Page), not in place of it:
 *   - Readiness Overview: rooms by status, % Ready and the blocked rooms with the rule's reason
 *   - My Work: a different list per role (my rooms, my repairs, inspections and triage)
 *   - Report a Defect: a short form for housekeeping staff and supervisors
 *
 * The widgets get their data from the RoomRelay REST API (GET /portal/overview, POST /commands)
 * through the roomRelayApi provider, so the same role checks, per-role data scoping and
 * readiness rules apply as in the full app. Widget scripts never read the tables directly.
 */

const roomRelayApi = SPAngularProvider({
    $id: Now.ID['roomrelay-sp-api-provider'],
    name: 'roomRelayApi',
    type: 'factory',
    script: Now.include('./widgets/roomRelayApi.provider.js'),
})

const readinessOverview = SPWidget({
    $id: Now.ID['roomrelay-sp-widget-overview'],
    name: 'RoomRelay Readiness Overview',
    id: 'roomrelay-readiness-overview',
    description: 'Rooms by readiness status, percentage Ready and the blocked rooms with the reason, for the signed-in user.',
    clientScript: Now.include('./widgets/readiness-overview/client.js'),
    htmlTemplate: Now.include('./widgets/readiness-overview/template.html'),
    angularProviders: [roomRelayApi],
    roles: ALL_APP_ROLES,
})

const myWork = SPWidget({
    $id: Now.ID['roomrelay-sp-widget-my-work'],
    name: 'RoomRelay My Work',
    id: 'roomrelay-my-work',
    description: 'What needs the signed-in user next: my rooms, my repairs, or inspections and triage for supervisors.',
    clientScript: Now.include('./widgets/my-work/client.js'),
    htmlTemplate: Now.include('./widgets/my-work/template.html'),
    angularProviders: [roomRelayApi],
    roles: ALL_APP_ROLES,
})

const reportDefect = SPWidget({
    $id: Now.ID['roomrelay-sp-widget-report-defect'],
    name: 'RoomRelay Report a Defect',
    id: 'roomrelay-report-defect',
    description: 'Report a defect for a room through the same rule as the full app (housekeeping staff and supervisors).',
    clientScript: Now.include('./widgets/report-defect/client.js'),
    htmlTemplate: Now.include('./widgets/report-defect/template.html'),
    angularProviders: [roomRelayApi],
    roles: [housekeeperRole, supervisorRole],
})

const homePage = SPPage({
    pageId: 'roomrelay_home',
    title: 'RoomRelay AI',
    category: 'custom',
    shortDescription: 'RoomRelay portal home: readiness overview, my work and report a defect.',
    roles: ALL_APP_ROLES,
    css: Now.include('./portal.scss'),
    containers: [
        {
            $id: Now.ID['roomrelay-sp-home-container'],
            name: 'RoomRelay home',
            width: 'container',
            semanticTag: 'main',
            order: 1,
            rows: [
                {
                    $id: Now.ID['roomrelay-sp-home-row'],
                    order: 1,
                    columns: [
                        {
                            $id: Now.ID['roomrelay-sp-home-col-main'],
                            size: 7,
                            sizeXs: 12,
                            order: 1,
                            instances: [
                                {
                                    $id: Now.ID['roomrelay-sp-instance-overview'],
                                    id: 'roomrelay-overview-instance',
                                    widget: readinessOverview,
                                    order: 1,
                                },
                            ],
                        },
                        {
                            $id: Now.ID['roomrelay-sp-home-col-side'],
                            size: 5,
                            sizeXs: 12,
                            order: 2,
                            instances: [
                                {
                                    $id: Now.ID['roomrelay-sp-instance-my-work'],
                                    id: 'roomrelay-my-work-instance',
                                    widget: myWork,
                                    order: 1,
                                },
                                {
                                    $id: Now.ID['roomrelay-sp-instance-report'],
                                    id: 'roomrelay-report-instance',
                                    widget: reportDefect,
                                    roles: [housekeeperRole, supervisorRole],
                                    order: 2,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
})

ServicePortal({
    $id: Now.ID['roomrelay-sp-portal'],
    title: 'RoomRelay AI',
    urlSuffix: 'roomrelay',
    homePage: homePage,
})
