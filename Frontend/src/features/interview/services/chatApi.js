import { api } from "../../../lib/apiClient.js"

/**
 * @description List this interview report's AI Mentor conversations (summaries + limits).
 */
export const listConversations = async (interviewId) => {
    const response = await api.get(`/api/chat/${interviewId}/conversations`)
    return response.data
}

/**
 * @description Get one conversation with its full message history.
 */
export const getConversation = async (interviewId, chatId) => {
    const response = await api.get(`/api/chat/${interviewId}/conversations/${chatId}`)
    return response.data
}

/**
 * @description Start a new conversation with its first message.
 */
export const createConversation = async (interviewId, content) => {
    const response = await api.post(`/api/chat/${interviewId}/conversations`, { content })
    return response.data
}

/**
 * @description Send a message in an existing conversation.
 */
export const sendMessage = async (interviewId, chatId, content) => {
    const response = await api.post(`/api/chat/${interviewId}/conversations/${chatId}/messages`, { content })
    return response.data
}

/**
 * @description Regenerate the last AI reply in a conversation.
 */
export const regenerateReply = async (interviewId, chatId) => {
    const response = await api.post(`/api/chat/${interviewId}/conversations/${chatId}/regenerate`)
    return response.data
}

/**
 * @description Delete a conversation.
 */
export const deleteConversation = async (interviewId, chatId) => {
    const response = await api.delete(`/api/chat/${interviewId}/conversations/${chatId}`)
    return response.data
}
