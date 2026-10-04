const OpenAIModule = require("openai")
const OpenAI = OpenAIModule.default || OpenAIModule
const { getAllowedOrigins } = require("../config/env")

/**
 * AI System 2 - the AI Mentor, served through OpenRouter using the OpenAI SDK.
 *
 * This is deliberately a separate file from services/ai.service.js (Gemini: resume
 * analysis + interview report generation). Nothing here touches Gemini.
 */

const FRIENDLY_ERROR = "Our AI Mentor is temporarily unavailable. Please try again in a few minutes."

// openrouter/free picks an available free model per request, so it survives retired model IDs.
const DEFAULT_PRIMARY_MODEL = "openrouter/free"
const DEFAULT_FALLBACK_MODEL = "qwen/qwen3-next-80b-a3b-instruct:free"

let client = null

function getClient() {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return null

    if (!client) {
        client = new OpenAI({
            apiKey,
            baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
            timeout: 25000,
            // The SDK retries 429/5xx by default. Every retry would count against
            // OpenRouter's small free-tier daily quota, and we already have our own
            // fallback model below, so disable the built-in retries.
            maxRetries: 0,
            defaultHeaders: {
                "HTTP-Referer": getAllowedOrigins()[0] || "http://localhost:5173",
                "X-Title": "CareerDock",
            },
        })
    }
    return client
}

function unavailableError() {
    const err = new Error(FRIENDLY_ERROR)
    err.statusCode = 503
    return err
}

/**
 * Some reasoning models leak <think>...</think> into the content. Strip it.
 */
function cleanReply(text) {
    return String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
}

/**
 * Errors where trying the second model can't help because they apply to the whole
 * OpenRouter account: bad key (401), no credits (402), or the account-wide daily cap
 * on :free models (429 mentioning "per day"). Retrying would just burn one more
 * request of a scarce daily quota.
 */
function isAccountWideFailure(err) {
    if (err?.status === 401 || err?.status === 402) return true
    return err?.status === 429 && /per[-\s]?day|daily/i.test(String(err?.message || ""))
}

/**
 * @description Sends the prompt to the primary model; on any failure (busy, rate
 * limited, provider down, empty reply) retries ONCE with the fallback model. If
 * both fail, throws a 503 with a friendly message. Never throws anything else, so
 * the server can't crash from a provider problem. Failures are logged server-side.
 *
 * @param {Array} messages OpenAI-style messages built by prompt.service
 * @returns {Promise<{content: string, model: string}>}
 */
async function generateMentorReply(messages) {
    const openai = getClient()
    if (!openai) {
        console.error("[mentor-ai] OPENROUTER_API_KEY is not set.")
        throw unavailableError()
    }

    const primary = process.env.MENTOR_PRIMARY_MODEL || DEFAULT_PRIMARY_MODEL
    const fallback = process.env.MENTOR_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL
    const models = fallback && fallback !== primary ? [primary, fallback] : [primary]

    for (const model of models) {
        try {
            const completion = await openai.chat.completions.create({
                model,
                messages,
                temperature: 0.6,
                max_tokens: 1200,
            })

            const content = cleanReply(completion?.choices?.[0]?.message?.content)
            if (!content) throw new Error("Model returned an empty reply.")

            return { content, model }
        } catch (err) {
            // Never log the prompt/messages - they contain the user's resume text.
            console.error(`[mentor-ai] ${model} failed:`, {
                status: err?.status,
                code: err?.code,
                message: err?.message,
            })
            if (isAccountWideFailure(err)) break
        }
    }

    throw unavailableError()
}

module.exports = {
    generateMentorReply,
    FRIENDLY_ERROR,
}
