import '@servicenow/sdk/global'
import { RestMessage } from '@servicenow/sdk/core'

/**
 * Outbound call to Groq's OpenAI-compatible chat API, used to write the shift briefing.
 * No secret lives here: the server adds "Authorization: Bearer <key>" at call time from the
 * encrypted system property x_2305075_roomrela.groq_api_key, which an administrator sets on the
 * instance (see docs/DEPLOYMENT_GUIDE.md). Without it the briefing falls back to the template.
 */
RestMessage({
    $id: Now.ID['groq-rest-message'],
    name: 'RoomRelay Groq',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    description: 'RoomRelay AI shift briefing: chat completion request to Groq (free tier). Key added at runtime.',
    authenticationType: 'noAuthentication',
    headers: [
        { $id: Now.ID['groq-header-content-type'], name: 'Content-Type', value: 'application/json' },
        { $id: Now.ID['groq-header-accept'], name: 'Accept', value: 'application/json' },
    ],
    functions: [{ name: 'chat completions', httpMethod: 'POST' }],
})
