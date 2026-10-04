const mongoose = require("mongoose")
const { computeExpiry } = require("../utils/chat.util")

/**
 * AI Mentor conversations. Each conversation belongs to exactly one user AND one
 * interview report:
 *
 * {
 *   userId, interviewId, title,
 *   messages: [{ role: "user" | "assistant", content, timestamp }],
 *   createdAt, updatedAt,          // added by { timestamps: true }
 *   expiresAt                      // TTL index deletes the document at this time
 * }
 */

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant"],
        required: [true, "Message role is required"]
    },
    content: {
        type: String,
        required: [true, "Message content is required"]
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false
})

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    interviewId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: true
    },
    title: {
        type: String,
        default: "New chat",
        maxlength: 80
    },
    messages: [messageSchema],
    expiresAt: {
        type: Date,
        required: true,
        default: () => computeExpiry()
    }
}, {
    timestamps: true
})

// TTL index: MongoDB itself removes a conversation once `expiresAt` has passed
// (expireAfterSeconds: 0 = "at the time stored in the field"). No cron job or
// cleanup route needed. Note the TTL monitor runs about once a minute, so
// deletion isn't instant to the second.
chatSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

// Serves "list my conversations for this report" and the oldest-first FIFO eviction.
chatSchema.index({ userId: 1, interviewId: 1, createdAt: 1 })

const chatModel = mongoose.model("MentorChat", chatSchema)

module.exports = chatModel
