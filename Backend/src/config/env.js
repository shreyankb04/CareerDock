/**
 * Central place for environment-variable rules, so a misconfigured deploy fails
 * loudly at startup instead of half-working.
 */
const ALWAYS_REQUIRED = ["MONGODB_URI", "JWT_SECRET"]
const PRODUCTION_REQUIRED = ["GOOGLE_GENAI_API_KEY", "RESEND_API_KEY", "FRONTEND_URL"]

function isProduction() {
    return process.env.NODE_ENV === "production"
}

/**
 * FRONTEND_URL may hold one origin or several comma-separated ones. Trailing
 * slashes are stripped because browsers send Origin without one.
 */
function getAllowedOrigins() {
    const origins = (process.env.FRONTEND_URL || "")
        .split(",")
        .map((v) => v.trim().replace(/\/+$/, ""))
        .filter(Boolean)
    if (origins.length === 0 && !isProduction()) return ["http://localhost:5173"]
    return origins
}

function validateEnv() {
    const missing = ALWAYS_REQUIRED.filter((n) => !process.env[n])
    if (isProduction()) missing.push(...PRODUCTION_REQUIRED.filter((n) => !process.env[n]))
    if (missing.length > 0) {
        console.error(`Missing required environment variable(s): ${missing.join(", ")}`)
        process.exit(1)
    }
    if (isProduction()) {
        const origins = getAllowedOrigins()
        if (origins.some((o) => !/^https?:\/\//i.test(o))) {
            console.error("FRONTEND_URL must include the protocol, e.g. https://careerdock.online")
            process.exit(1)
        }
        if (origins.some((o) => /localhost|127\.0\.0\.1/.test(o))) {
            console.warn("[config] FRONTEND_URL contains a localhost origin while NODE_ENV=production.")
        }
        if (process.env.JWT_SECRET.length < 32) {
            console.warn("[config] JWT_SECRET is shorter than 32 characters. Use a long random value.")
        }
        if (!process.env.OPENROUTER_API_KEY) {
            console.warn("[config] OPENROUTER_API_KEY is not set: AI Mentor and the report fallback will be unavailable.")
        }
    }
}

module.exports = { validateEnv, getAllowedOrigins, isProduction }
