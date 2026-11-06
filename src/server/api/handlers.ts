import { gs } from '@servicenow/glide'
import { applyCommand } from '../../client/app/applyCommand'
import { scopeSnapshotForRole } from '../../client/features/rooms/scope'
import { parseCommand } from '../../client/shared/api/commands'
import type { CommandFailureKind } from '../../client/shared/api/commands'
import type { Staff } from '../../client/shared/domain/types'
import { resetDemoData } from '../data/demoData'
import { loadSnapshot, saveChanges } from '../data/repository'
import { readJson, sendError, sendOk } from '../shared/http'
import type { RestRequest, RestResponse } from '../shared/http'
import { currentStaff, loadStaff } from '../shared/session'
import { nowIso } from '../shared/time'

/**
 * RoomRelay REST endpoints (defined in src/fluent/api/roomrelay-api.now.ts):
 *   GET  /me          who the caller is, as RoomRelay staff
 *   GET  /snapshot    everything the caller may see
 *   POST /commands    one change; body is a Command (src/client/shared/api/commands.ts)
 *   POST /demo/reset  reload the demo dataset (RoomRelay administrator only)
 *
 * Every handler identifies the caller from the session and applies the same rule functions the
 * frontend uses. Unexpected errors are logged and answered with a generic message.
 */

/** Runs a handler with the caller resolved, or answers 403 if they have no RoomRelay role. */
function withCaller(response: RestResponse, handle: (caller: Staff, staff: Staff[]) => void): void {
    try {
        const staff = loadStaff()
        const caller = currentStaff(staff)
        if (!caller) {
            sendError(response, 'forbidden', 'Your account does not have a RoomRelay role. Ask an administrator for access.')
            return
        }
        // Make sure the caller's name resolves even if they are not in the staff list (platform admin).
        handle(caller, staff.some((s) => s.id === caller.id) ? staff : [...staff, caller])
    } catch (err) {
        gs.error('RoomRelay API error: ' + (err instanceof Error ? err.message : String(err)))
        sendError(response, 'server', 'Something went wrong. Please try again.')
    }
}

const FAILURE_CODE: Record<CommandFailureKind, 'forbidden' | 'not_found' | 'invalid' | 'conflict'> = {
    forbidden: 'forbidden',
    not_found: 'not_found',
    invalid: 'invalid',
    conflict: 'conflict',
}

export function getMe(_request: RestRequest, response: RestResponse): void {
    withCaller(response, (caller) => sendOk(response, { account: caller }))
}

export function getSnapshot(_request: RestRequest, response: RestResponse): void {
    withCaller(response, (caller, staff) => {
        const { snapshot } = loadSnapshot(staff, { withAudit: true })
        sendOk(response, scopeSnapshotForRole(snapshot, caller.role, caller))
    })
}

export function postCommand(request: RestRequest, response: RestResponse): void {
    withCaller(response, (caller, staff) => {
        const command = parseCommand(readJson(request))
        if (!command) {
            sendError(response, 'invalid', 'That request is not a valid RoomRelay action.')
            return
        }
        // Load the current data, run the shared rule, and write back only what it changed.
        const { snapshot, ids } = loadSnapshot(staff, { withAudit: false })
        const result = applyCommand(snapshot, { actor: caller, now: nowIso() }, command)
        if (!result.ok) {
            sendError(response, FAILURE_CODE[result.kind], result.message, result.fieldErrors)
            return
        }
        saveChanges(snapshot, result.snapshot, ids)
        sendOk(response, { ok: true })
    })
}

export function postDemoReset(_request: RestRequest, response: RestResponse): void {
    withCaller(response, (caller) => {
        if (caller.role !== 'admin') {
            sendError(response, 'forbidden', 'Only the RoomRelay administrator can reset the demo data.')
            return
        }
        const result = resetDemoData(nowIso())
        if (!result.ok) sendError(response, 'conflict', result.message)
        else sendOk(response, { ok: true })
    })
}
