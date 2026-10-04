import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Bot, User, Copy, Check, RotateCcw } from "lucide-react"

/**
 * One message in the AI Mentor conversation. `isLatestAssistant` + `onRegenerate`
 * are only passed for the last assistant message, which is the only one that can
 * be regenerated.
 */
const ChatBubble = ({ message, isLatestAssistant, onRegenerate, regenerating }) => {
    const [ copied, setCopied ] = useState(false)
    const isUser = message.role === "user"

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
        } catch {
            // Clipboard API can be unavailable (older browsers, insecure context).
            // Not worth surfacing an error banner for - the copy button just resets silently.
        }
    }

    return (
        <div className={`chat-bubble ${isUser ? "chat-bubble--user" : "chat-bubble--assistant"}`}>
            <span className="chat-bubble__avatar" aria-hidden="true">
                {isUser ? <User size={15} /> : <Bot size={15} />}
            </span>

            <div className="chat-bubble__content">
                <div className="chat-bubble__text">
                    {isUser ? (
                        <p>{message.content}</p>
                    ) : (
                        <ReactMarkdown remarkPlugins={[ remarkGfm ]}>{message.content}</ReactMarkdown>
                    )}
                </div>

                {!isUser && (
                    <div className="chat-bubble__actions">
                        <button type="button" className="chat-bubble__action" onClick={handleCopy}>
                            {copied ? <Check size={13} /> : <Copy size={13} />}
                            {copied ? "Copied" : "Copy"}
                        </button>
                        {isLatestAssistant && (
                            <button
                                type="button"
                                className="chat-bubble__action"
                                onClick={onRegenerate}
                                disabled={regenerating}
                            >
                                <RotateCcw size={13} className={regenerating ? "chat-bubble__spin" : ""} />
                                Regenerate
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default ChatBubble
