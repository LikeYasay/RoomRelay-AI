import { gs } from '@servicenow/glide'
import { RESTMessageV2 } from '@servicenow/glide/sn_ws'

/**
 * Calls Groq once and returns the reply text, or a short, safe reason for the fallback.
 * The API key never leaves the server and is never logged; neither are the prompt or the reply.
 */

export const GROQ_MODEL = 'openai/gpt-oss-120b'
const KEY_PROPERTY = 'x_2305075_roomrela.groq_api_key'
const TIMEOUT_MS = 15000

export type AiCallResult = { ok: true; content: string } | { ok: false; reason: string }

// The typings describe the internal constructor; at runtime it takes the REST message and function names.
const RestMessage = RESTMessageV2 as unknown as new (messageName: string, functionName: string) => RESTMessageV2

export function callGroq(messages: Array<{ role: string; content: string }>): AiCallResult {
    const key = gs.getProperty(KEY_PROPERTY, '')
    if (!key) return { ok: false, reason: 'the AI is not set up on this instance yet' }

    const request = new RestMessage('RoomRelay Groq', 'chat completions')
    request.setHttpTimeout(TIMEOUT_MS)
    request.setRequestHeader('Authorization', `Bearer ${key}`)
    request.setRequestBody(
        JSON.stringify({
            model: GROQ_MODEL,
            messages,
            temperature: 0.2,
            max_completion_tokens: 1500,
            reasoning_effort: 'low',
            response_format: { type: 'json_object' },
        })
    )

    try {
        const reply = request.execute()
        const status = reply.getStatusCode()
        // Status 0 (or an error without an HTTP error code) means the request never got an answer.
        if (status === 0 || (reply.haveError() && status < 400)) return { ok: false, reason: 'the AI service could not be reached in time' }
        if (status === 401 || status === 403) return { ok: false, reason: 'the AI key was rejected' }
        if (status === 429) return { ok: false, reason: 'the free AI quota is used up for now' }
        if (status < 200 || status >= 300) {
            gs.warn(`RoomRelay AI: Groq answered HTTP ${status}`)
            return { ok: false, reason: 'the AI service returned an error' }
        }
        const body = JSON.parse(reply.getBody()) as { choices?: Array<{ message?: { content?: unknown } }> }
        const content = body.choices?.[0]?.message?.content
        return typeof content === 'string' && content.trim() !== '' ? { ok: true, content } : { ok: false, reason: 'the AI reply was empty' }
    } catch (err) {
        gs.warn(`RoomRelay AI: request failed (${err instanceof Error ? err.name : 'error'})`)
        return { ok: false, reason: 'the AI service could not be reached in time' }
    }
}
