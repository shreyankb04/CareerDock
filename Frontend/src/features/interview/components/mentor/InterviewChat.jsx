import { useEffect, useRef, useState } from "react"
import { Send, PanelLeft, X, AlertCircle } from "lucide-react"
import { useMentorChat } from "../../hooks/useMentorChat.js"
import MentorHeader from "./MentorHeader.jsx"
import ChatSidebar from "./ChatSidebar.jsx"
import ChatBubble from "./ChatBubble.jsx"
import SuggestedPrompts from "./SuggestedPrompts.jsx"

const TypingIndicator = () => (
    <div className="chat-bubble chat-bubble--assistant">
        <span className="chat-bubble__avatar" aria-hidden="true">
            <span className="chat-typing">
                <span /><span /><span />
            </span>
        </span>
    </div>
)

/**
 * AI Mentor tab of the Interview Report page. Owns layout only - all state and
 * API calls live in useMentorChat so this stays readable.
 */
const InterviewChat = ({ interviewId, matchScore }) => {
    const {
        conversations,
        limits,
        activeConversation,
        loadingList,
        loadingConversation,
        sending,
        error,
        clearError,
        startNewChat,
        openConversation,
        send,
        regenerate,
        remove,
    } = useMentorChat(interviewId)

    const [ draft, setDraft ] = useState("")
    const [ mobileSidebarOpen, setMobileSidebarOpen ] = useState(false)
    const scrollRef = useRef(null)
    const textareaRef = useRef(null)

    const messages = activeConversation?.messages || []
    const messageCount = messages.length
    const atMessageLimit = messageCount >= limits.maxMessages

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [ messages.length, sending ])

    const handleSelectConversation = (chatId) => {
        openConversation(chatId)
        setMobileSidebarOpen(false)
    }

    const handleNewChat = () => {
        startNewChat()
        setDraft("")
        setMobileSidebarOpen(false)
    }

    const submitDraft = () => {
        const text = draft.trim()
        if (!text || sending) return
        send(text)
        setDraft("")
        if (textareaRef.current) textareaRef.current.style.height = "auto"
    }

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            submitDraft()
        }
    }

    const handleDraftChange = (e) => {
        setDraft(e.target.value.slice(0, limits.maxMessageChars))
        e.target.style.height = "auto"
        e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
    }

    return (
        <div className="mentor">
            <MentorHeader matchScore={matchScore} limits={limits} conversationCount={conversations.length} />

            <div className="mentor__body">
                <button
                    type="button"
                    className="mentor__mobile-history-toggle"
                    onClick={() => setMobileSidebarOpen(true)}
                >
                    <PanelLeft size={15} /> Chat History
                </button>

                <ChatSidebar
                    conversations={conversations}
                    activeConversationId={activeConversation?._id}
                    limits={limits}
                    loading={loadingList}
                    onNewChat={handleNewChat}
                    onOpen={handleSelectConversation}
                    onDelete={remove}
                    className="mentor__sidebar--desktop"
                />

                {mobileSidebarOpen && (
                    <div className="mentor__mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}>
                        <div className="mentor__mobile-sidebar" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                className="mentor__mobile-sidebar-close"
                                onClick={() => setMobileSidebarOpen(false)}
                                aria-label="Close"
                            >
                                <X size={18} />
                            </button>
                            <ChatSidebar
                                conversations={conversations}
                                activeConversationId={activeConversation?._id}
                                limits={limits}
                                loading={loadingList}
                                onNewChat={handleNewChat}
                                onOpen={handleSelectConversation}
                                onDelete={remove}
                            />
                        </div>
                    </div>
                )}

                <div className="mentor__chat">
                    <div className="mentor__messages" ref={scrollRef}>
                        {loadingConversation ? (
                            <div className="mentor__messages-loading">
                                <div className="cd-skeleton mentor__skeleton-line" />
                                <div className="cd-skeleton mentor__skeleton-line" />
                                <div className="cd-skeleton mentor__skeleton-line mentor__skeleton-line--short" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="mentor__welcome">
                                <p className="mentor__welcome-text">
                                    Ask me anything about this interview report - your resume, the questions, your roadmap, or your skill gaps.
                                </p>
                                <SuggestedPrompts onSelect={(prompt) => send(prompt)} disabled={sending} />
                            </div>
                        ) : (
                            <>
                                {messages.map((message, index) => {
                                    const isLastAssistant = message.role === "assistant" && index === messages.length - 1
                                    return (
                                        <ChatBubble
                                            key={index}
                                            message={message}
                                            isLatestAssistant={isLastAssistant}
                                            onRegenerate={regenerate}
                                            regenerating={sending && isLastAssistant}
                                        />
                                    )
                                })}
                                {sending && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
                            </>
                        )}
                    </div>

                    {error && (
                        <div className="mentor__error" role="alert">
                            <AlertCircle size={14} /> {error}
                            <button type="button" onClick={clearError} aria-label="Dismiss">
                                <X size={13} />
                            </button>
                        </div>
                    )}

                    <div className="mentor__composer">
                        <textarea
                            ref={textareaRef}
                            className="mentor__composer-input"
                            placeholder={atMessageLimit ? "Message limit reached for this chat - start a new one to continue." : "Ask your AI Mentor anything about this report..."}
                            value={draft}
                            onChange={handleDraftChange}
                            onKeyDown={handleKeyDown}
                            disabled={sending || atMessageLimit}
                            rows={1}
                        />
                        <div className="mentor__composer-footer">
                            <span className="mentor__composer-count">
                                {activeConversation ? `${messageCount} / ${limits.maxMessages} messages remembered` : `${draft.length} / ${limits.maxMessageChars}`}
                            </span>
                            <button
                                type="button"
                                className="button primary-button mentor__send"
                                onClick={submitDraft}
                                disabled={sending || !draft.trim() || atMessageLimit}
                            >
                                <Send size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InterviewChat
