const chatModel = require("../models/chat.model")
const interviewReportModel = require("../models/interviewReport.model")
const { buildMentorMessages } = require("../services/prompt.service")
const { generateMentorReply } = require("../services/mentorAi.service")
const {
    MAX_CONVERSATIONS_PER_REPORT,
    MAX_MESSAGES_PER_CONVERSATION,
    MAX_MESSAGE_CHARS,
    computeExpiry,
    makeTitle,
    trimToLimit,
} = require("../utils/chat.util")

/**
 * AI Mentor controller. All routes sit behind authUserMiddleware, so req.user.id
 * is the logged-in user. Errors are thrown (Express 5 forwards rejected promises)
 * and formatted by the existing centralized errorHandler middleware.
 */

const OBJECT_ID = /^[a-f\d]{24}$/i

function httpError(statusCode, message) {
    const err = new Error(message)
    err.statusCode = statusCode
    return err
}

function assertObjectId(value, label) {
    if (typeof value !== "string" || !OBJECT_ID.test(value)) {
        throw httpError(400, `Invalid ${label}.`)
    }
}

function validateContent(body) {
    const content = typeof body?.content === "string" ? body.content.trim() : ""
    if (!content) throw httpError(400, "Message cannot be empty.")
    if (content.length > MAX_MESSAGE_CHARS) {
        throw httpError(400, `Messages are limited to ${MAX_MESSAGE_CHARS} characters.`)
    }
    return content
}

/**
 * Ownership check for the interview report. Also the source of the AI context:
 * the frontend never sends report data, the backend loads it here.
 */
async function loadOwnedReport(req) {
    const { interviewId } = req.params
    assertObjectId(interviewId, "interview report id")

    const report = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id }).lean()
    if (!report) throw httpError(404, "Interview report not found.")
    return report
}

async function loadOwnedChat(req) {
    const { interviewId, chatId } = req.params
    assertObjectId(interviewId, "interview report id")
    assertObjectId(chatId, "conversation id")

    const chat = await chatModel.findOne({ _id: chatId, interviewId, userId: req.user.id })
    if (!chat) throw httpError(404, "Conversation not found.")
    return chat
}

function toConversationDTO(chat) {
    return {
        _id: chat._id,
        interviewId: chat.interviewId,
        title: chat.title,
        messages: (chat.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
        })),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        expiresAt: chat.expiresAt,
    }
}

function toSummaryDTO(chat) {
    return {
        _id: chat._id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messageCount: (chat.messages || []).length,
    }
}

const LIMITS = {
    maxConversations: MAX_CONVERSATIONS_PER_REPORT,
    maxMessages: MAX_MESSAGES_PER_CONVERSATION,
    maxMessageChars: MAX_MESSAGE_CHARS,
}

async function askMentor({ report, history, userMessage }) {
    const messages = buildMentorMessages({
        report,
        history,
        userMessage,
        isFirstTurn: history.length === 0,
    })
    const { content } = await generateMentorReply(messages)
    return content
}

/**
 * FIFO for conversations: if this report now has more than the allowed number,
 * delete the oldest (by creation time). Returns how many were removed.
 */
async function enforceConversationLimit(userId, interviewId) {
    const count = await chatModel.countDocuments({ userId, interviewId })
    const excess = count - MAX_CONVERSATIONS_PER_REPORT
    if (excess <= 0) return 0

    const oldest = await chatModel
        .find({ userId, interviewId })
        .sort({ createdAt: 1 })
        .limit(excess)
        .select("_id")
        .lean()

    await chatModel.deleteMany({ _id: { $in: oldest.map((c) => c._id) } })
    return oldest.length
}

/**
 * @route GET /api/chat/:interviewId/conversations
 * @desc  List this report's conversations (newest activity first) + the limits
 */
async function listConversationsController(req, res) {
    await loadOwnedReport(req)

    const chats = await chatModel
        .find({ userId: req.user.id, interviewId: req.params.interviewId })
        .sort({ updatedAt: -1 })
        .select("title createdAt updatedAt messages")
        .lean()

    res.status(200).json({
        conversations: chats.map(toSummaryDTO),
        limits: LIMITS,
    })
}

/**
 * @route GET /api/chat/:interviewId/conversations/:chatId
 */
async function getConversationController(req, res) {
    const chat = await loadOwnedChat(req)
    res.status(200).json({ conversation: toConversationDTO(chat) })
}

/**
 * @route POST /api/chat/:interviewId/conversations
 * @desc  Start a conversation with its first message. The conversation is only
 *        saved after the AI has replied, so a failed AI call leaves nothing
 *        behind and never uses up one of the 10 conversation slots.
 */
async function createConversationController(req, res) {
    const content = validateContent(req.body)
    const report = await loadOwnedReport(req)

    const reply = await askMentor({ report, history: [], userMessage: content })

    const now = new Date()
    const chat = await chatModel.create({
        userId: req.user.id,
        interviewId: req.params.interviewId,
        title: makeTitle(content),
        messages: [
            { role: "user", content, timestamp: now },
            { role: "assistant", content: reply, timestamp: new Date() },
        ],
        expiresAt: computeExpiry(),
    })

    const removed = await enforceConversationLimit(req.user.id, req.params.interviewId)

    res.status(201).json({
        conversation: toConversationDTO(chat),
        removedOldest: removed > 0,
    })
}

/**
 * @route POST /api/chat/:interviewId/conversations/:chatId/messages
 * @desc  Append a user message + the AI reply. Keeps only the newest 20 messages.
 */
async function sendMessageController(req, res) {
    const content = validateContent(req.body)
    const chat = await loadOwnedChat(req)
    const report = await loadOwnedReport(req)

    const history = chat.messages.map((m) => ({ role: m.role, content: m.content }))
    const reply = await askMentor({ report, history, userMessage: content })

    chat.messages.push(
        { role: "user", content, timestamp: new Date() },
        { role: "assistant", content: reply, timestamp: new Date() }
    )
    trimToLimit(chat.messages)
    chat.expiresAt = computeExpiry()
    await chat.save()

    res.status(200).json({ conversation: toConversationDTO(chat) })
}

/**
 * @route POST /api/chat/:interviewId/conversations/:chatId/regenerate
 * @desc  Replace the last AI reply with a fresh one for the same user message.
 */
async function regenerateController(req, res) {
    const chat = await loadOwnedChat(req)
    const report = await loadOwnedReport(req)

    const messages = chat.messages
    const last = messages[messages.length - 1]
    const previous = messages[messages.length - 2]
    if (!last || last.role !== "assistant" || !previous || previous.role !== "user") {
        throw httpError(400, "There is no reply to regenerate.")
    }

    const history = messages.slice(0, -2).map((m) => ({ role: m.role, content: m.content }))
    const reply = await askMentor({ report, history, userMessage: previous.content })

    last.content = reply
    last.timestamp = new Date()
    chat.expiresAt = computeExpiry()
    await chat.save()

    res.status(200).json({ conversation: toConversationDTO(chat) })
}

/**
 * @route DELETE /api/chat/:interviewId/conversations/:chatId
 */
async function deleteConversationController(req, res) {
    const { interviewId, chatId } = req.params
    assertObjectId(interviewId, "interview report id")
    assertObjectId(chatId, "conversation id")

    const result = await chatModel.deleteOne({ _id: chatId, interviewId, userId: req.user.id })
    if (result.deletedCount === 0) throw httpError(404, "Conversation not found.")

    res.status(200).json({ message: "Conversation deleted." })
}

module.exports = {
    listConversationsController,
    getConversationController,
    createConversationController,
    sendMessageController,
    regenerateController,
    deleteConversationController,
}
