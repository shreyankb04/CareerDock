const rateLimit = require("express-rate-limit")

// Shared JSON response shape so the frontend can show a consistent "slow down" message.
function limitHandler(req, res) {
    res.status(429).json({
        message: "Too many requests. Please wait a bit before trying again.",
    })
}

/**
 * @description Login: brute-force protection. Keyed by IP.
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler,
})

/**
 * @description Signup: slows down mass account creation. Keyed by IP.
 */
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler,
})

/**
 * @description Covers resend-otp and forgot-password/request-otp - the two
 * endpoints that actually trigger an outbound email, so they're the ones most
 * worth protecting from being used to spam someone's inbox.
 */
const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    handler: limitHandler,
})

/**
 * @description Guesses against a 6-digit OTP (signup + password-reset verification).
 * Keyed by IP + target email so a shared college/office IP isn't locked out by strangers.
 */
const otpVerifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}|${String(req.body?.email || "").trim().toLowerCase()}`,
    handler: limitHandler,
})

/**
 * @description AI generation is the most expensive endpoint (Gemini call +
 * PDF parsing). Keyed by user id when available (route is authenticated),
 * falling back to IP.
 */
const aiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: limitHandler,
})

module.exports = {
    loginLimiter,
    signupLimiter,
    otpLimiter,
    otpVerifyLimiter,
    aiLimiter,
}
