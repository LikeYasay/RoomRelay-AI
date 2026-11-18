import '@servicenow/sdk/global'
import { UiPage } from '@servicenow/sdk/core'
import incidentPage from '../../client/index.html'

UiPage({
    $id: Now.ID['incident-manager-page'],
    endpoint: 'x_2318724_roomrela_incident_manager.do',
    description: 'RoomRelay AI hotel operations UI Page',
    category: 'general',
    html: incidentPage,
    direct: true,
})
