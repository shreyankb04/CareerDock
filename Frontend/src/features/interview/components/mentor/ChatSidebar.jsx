import { useState } from "react"
import { Plus, MessageCircle, Trash2, X } from "lucide-react"

function formatDate(value) {
    return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const ChatSidebar = ({
    conversations,
    activeConversationId,
    limits,
    loading,
    onNewChat,
    onOpen,
    onDelete,
    className = "",
}) => {
    const [ pendingDeleteId, setPendingDeleteId ] = useState(null)
    const atLimit = conversations.length >= limits.maxConversations

    const confirmDelete = () => {
        onDelete(pendingDeleteId)
        setPendingDeleteId(null)
    }

    return (
        <aside className={`chat-sidebar ${className}`}>
            <div className="chat-sidebar__header">
                <button type="button" className="button primary-button chat-sidebar__new" onClick={onNewChat}>
                    <Plus size={15} /> New Chat
                </button>
                <p className="chat-sidebar__counter">
                    {conversations.length} / {limits.maxConversations} conversations used
                    {atLimit && <span className="chat-sidebar__counter-note"> - starting a new one removes the oldest</span>}
                </p>
                <div className="chat-sidebar__progress">
                    <div
                        className="chat-sidebar__progress-fill"
                        style={{ width: `${Math.min(100, (conversations.length / limits.maxConversations) * 100)}%` }}
                    />
                </div>
            </div>

            <div className="chat-sidebar__list">
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => <div key={i} className="chat-sidebar__skeleton cd-skeleton" />)
                ) : conversations.length === 0 ? (
                    <p className="chat-sidebar__empty">No conversations yet. Ask the mentor something to start one.</p>
                ) : (
                    conversations.map((c) => (
                        <div
                            key={c._id}
                            className={`chat-sidebar__item ${c._id === activeConversationId ? "chat-sidebar__item--active" : ""}`}
                        >
                            <button type="button" className="chat-sidebar__item-main" onClick={() => onOpen(c._id)}>
                                <MessageCircle size={14} />
                                <span className="chat-sidebar__item-text">
                                    <span className="chat-sidebar__item-title">{c.title}</span>
                                    <span className="chat-sidebar__item-date">{formatDate(c.createdAt)}</span>
                                </span>
                            </button>
                            <button
                                type="button"
                                className="chat-sidebar__item-delete"
                                onClick={() => setPendingDeleteId(c._id)}
                                aria-label="Delete conversation"
                            >
                                <Trash2 size={13} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {pendingDeleteId && (
                <div className="mentor-info-overlay" onClick={() => setPendingDeleteId(null)}>
                    <div className="mentor-info-card mentor-info-card--confirm" onClick={(e) => e.stopPropagation()}>
                        <div className="mentor-info-card__header">
                            <h3>Delete conversation?</h3>
                            <button type="button" onClick={() => setPendingDeleteId(null)} aria-label="Cancel">
                                <X size={16} />
                            </button>
                        </div>
                        <p>This will permanently delete this conversation and its messages. This can't be undone.</p>
                        <div className="mentor-info-card__confirm-actions">
                            <button type="button" className="button secondary-button" onClick={() => setPendingDeleteId(null)}>
                                Cancel
                            </button>
                            <button type="button" className="button primary-button" onClick={confirmDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    )
}

export default ChatSidebar
