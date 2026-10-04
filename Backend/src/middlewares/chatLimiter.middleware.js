const rateLimit = require("express-rate-limit")

/**
 * @description Throttles the AI Mentor routes that actually call the model
 * (create conversation, send message, regenerate). Keyed by user id - these
 * routes sit behind the JWT middleware - falling back to IP.
 *
 * This protects the shared OpenRouter quota from one user burning it. Reading,
 * listing and deleting conversations are cheap and are not limited here.
 */
const chatLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.user?.id || req.ip,
    handler: (req, res) => {
        res.status(429).json({
            message: "You're sending messages too quickly. Please wait a little before asking the AI Mentor again.",
        })
    },
})

module.exports = { chatLimiter }
