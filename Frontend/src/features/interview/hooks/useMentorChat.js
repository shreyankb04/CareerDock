import { useCallback, useEffect, useRef, useState } from "react"
import {
    listConversations,
    getConversation,
    createConversation,
    sendMessage,
    regenerateReply,
    deleteConversation,
} from "../services/chatApi.js"

const DEFAULT_LIMITS = { maxConversations: 10, maxMessages: 20, maxMessageChars: 1500 }

function extractErrorMessage(error) {
    return error?.response?.data?.message || "Something went wrong. Please try again."
}

/**
 * Owns everything the AI Mentor UI needs: the conversation list for this
 * interview report, the currently open conversation, and the actions that
 * mutate them. Kept separate from InterviewContext since it's scoped to one
 * report's mentor chats rather than the report itself.
 */
export const useMentorChat = (interviewId) => {
    const [ conversations, setConversations ] = useState([])
    const [ limits, setLimits ] = useState(DEFAULT_LIMITS)
    const [ activeConversation, setActiveConversation ] = useState(null)
    const [ loadingList, setLoadingList ] = useState(true)
    const [ loadingConversation, setLoadingConversation ] = useState(false)
    const [ sending, setSending ] = useState(false)
    const [ error, setError ] = useState("")

    // Guards against a slow "open conversation A" response landing after the
    // user has already clicked into conversation B.
    const requestToken = useRef(0)

    const refreshList = useCallback(async () => {
        setLoadingList(true)
        try {
            const data = await listConversations(interviewId)
            setConversations(data.conversations)
            setLimits(data.limits)
        } catch (err) {
            setError(extractErrorMessage(err))
        } finally {
            setLoadingList(false)
        }
    }, [ interviewId ])

    useEffect(() => {
        if (interviewId) refreshList()
    }, [ interviewId, refreshList ])

    const startNewChat = useCallback(() => {
        setActiveConversation(null)
        setError("")
    }, [])

    const openConversation = useCallback(async (chatId) => {
        const token = ++requestToken.current
        setLoadingConversation(true)
        setError("")
        try {
            const data = await getConversation(interviewId, chatId)
            if (token === requestToken.current) setActiveConversation(data.conversation)
        } catch (err) {
            if (token === requestToken.current) setError(extractErrorMessage(err))
        } finally {
            if (token === requestToken.current) setLoadingConversation(false)
        }
    }, [ interviewId ])

    /**
     * Sends a message. Creates a new conversation on the backend if none is
     * open yet, otherwise appends to the active one. Either way, the whole
     * conversation returned by the API becomes the new active conversation -
     * no optimistic local message juggling to keep in sync with FIFO trimming.
     */
    const send = useCallback(async (content) => {
        const trimmed = content.trim()
        if (!trimmed || sending) return

        setSending(true)
        setError("")
        try {
            const data = activeConversation
                ? await sendMessage(interviewId, activeConversation._id, trimmed)
                : await createConversation(interviewId, trimmed)

            setActiveConversation(data.conversation)
            // The list only needs a full refresh when a new conversation was
            // created (title/order changes) or the oldest one got evicted.
            if (!activeConversation || data.removedOldest) {
                refreshList()
            } else {
                setConversations((prev) => prev.map((c) => (
                    c._id === data.conversation._id
                        ? { ...c, title: data.conversation.title, updatedAt: data.conversation.updatedAt, messageCount: data.conversation.messages.length }
                        : c
                )))
            }
        } catch (err) {
            setError(extractErrorMessage(err))
        } finally {
            setSending(false)
        }
    }, [ interviewId, activeConversation, sending, refreshList ])

    const regenerate = useCallback(async () => {
        if (!activeConversation || sending) return
        setSending(true)
        setError("")
        try {
            const data = await regenerateReply(interviewId, activeConversation._id)
            setActiveConversation(data.conversation)
        } catch (err) {
            setError(extractErrorMessage(err))
        } finally {
            setSending(false)
        }
    }, [ interviewId, activeConversation, sending ])

    const remove = useCallback(async (chatId) => {
        try {
            await deleteConversation(interviewId, chatId)
            setConversations((prev) => prev.filter((c) => c._id !== chatId))
            setActiveConversation((current) => (current?._id === chatId ? null : current))
        } catch (err) {
            setError(extractErrorMessage(err))
        }
    }, [ interviewId ])

    return {
        conversations,
        limits,
        activeConversation,
        loadingList,
        loadingConversation,
        sending,
        error,
        clearError: () => setError(""),
        startNewChat,
        openConversation,
        send,
        regenerate,
        remove,
    }
}
