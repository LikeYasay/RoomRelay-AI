/**
 * Small helpers for Scripted REST handlers: one success shape, one error envelope.
 * Error bodies never contain stack traces, table names or script text, only the safe
 * messages written by the rules (see BACKEND_HANDOFF.md section 7.3).
 */

// The request and response objects come from the Scripted REST runtime (sn_ws).
export interface RestRequest {
    body: { dataString: string } | null
}
export interface RestResponse {
    setStatus(code: number): void
    setBody(body: object): void
}

export type ErrorCode = 'unauthenticated' | 'forbidden' | 'not_found' | 'invalid' | 'conflict' | 'server'

const STATUS: Record<ErrorCode, number> = {
    unauthenticated: 401,
    forbidden: 403,
    not_found: 404,
    invalid: 400,
    conflict: 409,
    server: 500,
}

export function sendOk(response: RestResponse, body: object): void {
    response.setStatus(200)
    response.setBody(body)
}

export function sendError(response: RestResponse, code: ErrorCode, message: string, fieldErrors?: Record<string, string>): void {
    response.setStatus(STATUS[code])
    response.setBody({ error: { code, message, ...(fieldErrors ? { fieldErrors } : {}) } })
}

/** Parses the JSON body. Returns undefined for an empty or malformed body. */
export function readJson(request: RestRequest): unknown {
    try {
        // Reading the body can throw when the request has none.
        const raw = request.body?.dataString
        return raw ? JSON.parse(raw) : undefined
    } catch {
        return undefined
    }
}
