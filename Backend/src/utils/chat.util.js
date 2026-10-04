// Single source of truth for AI Mentor limits + tiny pure helpers.
// Kept dependency-free so it can be shared by the model, controller and prompt builder.

const MAX_CONVERSATIONS_PER_REPORT = 10
const MAX_MESSAGES_PER_CONVERSATION = 20
const MAX_MESSAGE_CHARS = 1500
const CHAT_TTL_DAYS = 30
const HISTORY_WINDOW = 6 // recent messages sent to the model on follow-up turns

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * @description When a conversation should be deleted by the MongoDB TTL index.
 * Refreshed on every new message, so a conversation lives for 30 days after its
 * last activity rather than vanishing mid-use 30 days after it was created.
 */
function computeExpiry(now = Date.now()) {
    return new Date(now + CHAT_TTL_DAYS * DAY_MS)
}

/**
 * @description Conversation title from the first user message.
 */
function makeTitle(text) {
    const clean = String(text || "").replace(/\s+/g, " ").trim()
    if (!clean) return "New chat"
    return clean.length > 50 ? `${clean.slice(0, 50).trimEnd()}…` : clean
}

/**
 * @description FIFO: keeps only the newest MAX_MESSAGES_PER_CONVERSATION messages.
 * Mutates in place so it works on both plain arrays and Mongoose arrays (splice
 * marks a Mongoose array as modified). Never leaves an orphaned assistant reply
 * at the start of the history.
 */
function trimToLimit(messages) {
    const excess = messages.length - MAX_MESSAGES_PER_CONVERSATION
    if (excess > 0) messages.splice(0, excess)
    while (messages.length > 0 && messages[0].role === "assistant") messages.splice(0, 1)
    return messages
}

module.exports = {
    MAX_CONVERSATIONS_PER_REPORT,
    MAX_MESSAGES_PER_CONVERSATION,
    MAX_MESSAGE_CHARS,
    CHAT_TTL_DAYS,
    HISTORY_WINDOW,
    computeExpiry,
    makeTitle,
    trimToLimit,
}
