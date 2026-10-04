const { GoogleGenAI } = require("@google/genai")
const OpenAIModule = require("openai")
const OpenAI = OpenAIModule.default || OpenAIModule
const { zodToJsonSchema } = require("zod-to-json-schema")
const { getAllowedOrigins } = require("../config/env")

/**
 * Shared "structured JSON from an AI model" helper for the interview report and resume
 * PDF (the AI Mentor chat has its own service, mentorAi.service.js).
 *
 * One attempt per provider, no retry loops:
 *   1. Gemini (primary) with a response schema.
 *   2. OpenRouter fallback, only if OPENROUTER_API_KEY is set, same schema requested in the prompt.
 *   3. Both fail (error, timeout, empty or invalid output) -> controlled 503 with a user-safe message.
 * Output from either provider is validated by the SAME zod schema before it is returned.
 * Raw provider errors are logged server-side only.
 */

const AI_UNAVAILABLE_MESSAGE = "AI analysis is temporarily unavailable. Please try again in a few minutes."
const GEMINI_MODEL = "gemini-3.6-flash"
const DEFAULT_FALLBACK_MODEL = "openrouter/free"
const GEMINI_TIMEOUT_MS = 60 * 1000
const FALLBACK_TIMEOUT_MS = 30 * 1000

let geminiClient = null
let fallbackClient = null

function getGeminiClient() {
    if (!process.env.GOOGLE_GENAI_API_KEY) return null
    if (!geminiClient) geminiClient = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })
    return geminiClient
}

function getFallbackClient() {
    if (!process.env.OPENROUTER_API_KEY) return null
    if (!fallbackClient) {
        fallbackClient = new OpenAI({
            apiKey: process.env.OPENROUTER_API_KEY,
            baseURL: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
            maxRetries: 0, // hidden SDK retries would burn the small free-tier quota
            defaultHeaders: {
                "HTTP-Referer": getAllowedOrigins()[0] || "http://localhost:5173",
                "X-Title": "CareerDock",
            },
        })
    }
    return fallbackClient
}

function aiUnavailableError() {
    const err = new Error(AI_UNAVAILABLE_MESSAGE)
    err.statusCode = 503
    return err
}

function withTimeout(promise, ms, label) {
    let timer
    const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms)
    })
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/** Parses JSON, tolerating ```json fences and <think> blocks some free models add. */
function parseJsonText(text) {
    const raw = String(text ?? "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim()
    if (!raw) throw new Error("Model returned an empty reply")
    const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    try {
        return JSON.parse(unfenced)
    } catch {
        const start = unfenced.indexOf("{")
        const end = unfenced.lastIndexOf("}")
        if (start !== -1 && end > start) return JSON.parse(unfenced.slice(start, end + 1))
        throw new Error("Model did not return valid JSON")
    }
}

/**
 * zod's object parsing strips unknown keys, so the result has ONLY the expected fields.
 * The thrown message lists field paths only, never values.
 */
function validateWithSchema(schema, data) {
    const result = schema.safeParse(data)
    if (!result.success) {
        const issues = result.error.issues
            .slice(0, 5)
            .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
            .join("; ")
        throw new Error(`AI output failed validation - ${issues}`)
    }
    return result.data
}

function logProviderFailure(label, provider, err) {
    // Never log the prompt: it contains the user's resume text.
    console.error(`[ai] ${label}: ${provider} failed:`, {
        status: err?.status,
        code: err?.code,
        message: String(err?.message || err).slice(0, 300),
    })
}

async function generateStructured({ label, prompt, requestSchema, validate }) {
    const jsonSchema = zodToJsonSchema(requestSchema)

    const gemini = getGeminiClient()
    if (gemini) {
        try {
            const response = await withTimeout(
                gemini.models.generateContent({
                    model: GEMINI_MODEL,
                    contents: prompt,
                    config: { responseMimeType: "application/json", responseSchema: jsonSchema },
                }),
                GEMINI_TIMEOUT_MS,
                "Gemini request"
            )
            return validate(parseJsonText(response?.text))
        } catch (err) {
            logProviderFailure(label, "gemini", err)
        }
    } else {
        console.error(`[ai] ${label}: GOOGLE_GENAI_API_KEY is not set.`)
    }

    const fallback = getFallbackClient()
    if (fallback) {
        const model = process.env.REPORT_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL
        try {
            const completion = await fallback.chat.completions.create(
                {
                    model,
                    messages: [{
                        role: "user",
                        content: `${prompt}\n\nOUTPUT FORMAT: Respond with ONLY one valid JSON object that conforms to the JSON Schema below. No markdown, no code fences, no commentary.\n${JSON.stringify(jsonSchema)}`,
                    }],
                    temperature: 0.3,
                    max_tokens: 6000,
                },
                { timeout: FALLBACK_TIMEOUT_MS }
            )
            return validate(parseJsonText(completion?.choices?.[0]?.message?.content))
        } catch (err) {
            logProviderFailure(label, "openrouter-fallback", err)
        }
    }

    throw aiUnavailableError()
}

module.exports = { generateStructured, validateWithSchema, AI_UNAVAILABLE_MESSAGE }
