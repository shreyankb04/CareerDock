const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const { chatLimiter } = require("../middlewares/chatLimiter.middleware")
const chatController = require("../controllers/chat.controller")

const chatRouter = express.Router()

// Every AI Mentor route requires a valid JWT. Ownership of the interview report /
// conversation is then checked again inside each controller.
chatRouter.use(authMiddleware.authUserMiddleware)

/**
 * @route GET api/chat/:interviewId/conversations
 * @desc List the logged in user's conversations for this interview report
 * @access private
 */
chatRouter.get("/:interviewId/conversations", chatController.listConversationsController)

/**
 * @route POST api/chat/:interviewId/conversations
 * @desc Start a new conversation with its first message (body: { content })
 * @access private
 */
chatRouter.post("/:interviewId/conversations", chatLimiter, chatController.createConversationController)

/**
 * @route GET api/chat/:interviewId/conversations/:chatId
 * @desc Get one conversation with its messages
 * @access private
 */
chatRouter.get("/:interviewId/conversations/:chatId", chatController.getConversationController)

/**
 * @route POST api/chat/:interviewId/conversations/:chatId/messages
 * @desc Send a message in an existing conversation (body: { content })
 * @access private
 */
chatRouter.post("/:interviewId/conversations/:chatId/messages", chatLimiter, chatController.sendMessageController)

/**
 * @route POST api/chat/:interviewId/conversations/:chatId/regenerate
 * @desc Regenerate the last AI reply
 * @access private
 */
chatRouter.post("/:interviewId/conversations/:chatId/regenerate", chatLimiter, chatController.regenerateController)

/**
 * @route DELETE api/chat/:interviewId/conversations/:chatId
 * @desc Delete one conversation
 * @access private
 */
chatRouter.delete("/:interviewId/conversations/:chatId", chatController.deleteConversationController)

module.exports = chatRouter
