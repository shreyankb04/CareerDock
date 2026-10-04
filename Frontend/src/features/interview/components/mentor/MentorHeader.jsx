import { useState } from "react"
import { Sparkles, Info, X } from "lucide-react"
import GradientBadge from "../../../../components/ui/GradientBadge.jsx"

const MentorHeader = ({ matchScore, limits, conversationCount }) => {
    const [ showInfo, setShowInfo ] = useState(false)

    return (
        <div className="mentor-header">
            <div className="mentor-header__top">
                <div className="mentor-header__title-group">
                    <span className="mentor-header__icon"><Sparkles size={18} /></span>
                    <div>
                        <h2>AI Mentor</h2>
                        <p className="mentor-header__tagline">Your personalized interview coach.</p>
                    </div>
                </div>

                <div className="mentor-header__badges">
                    <GradientBadge tone="brand">Match Score {matchScore}%</GradientBadge>
                    <GradientBadge tone="success">Context Loaded</GradientBadge>
                    <button
                        type="button"
                        className="mentor-header__info-btn"
                        onClick={() => setShowInfo(true)}
                        aria-label="About AI Mentor limits"
                    >
                        <Info size={15} />
                    </button>
                </div>
            </div>

            <p className="mentor-header__subtitle">
                AI Mentor already knows your resume, interview questions, roadmap and skill gaps.
            </p>

            {showInfo && (
                <div className="mentor-info-overlay" onClick={() => setShowInfo(false)}>
                    <div className="mentor-info-card" onClick={(e) => e.stopPropagation()}>
                        <div className="mentor-info-card__header">
                            <h3>CareerDock AI Mentor <span>(Free Version)</span></h3>
                            <button type="button" onClick={() => setShowInfo(false)} aria-label="Close">
                                <X size={16} />
                            </button>
                        </div>
                        <ul>
                            <li>{limits.maxConversations} conversations per interview report</li>
                            <li>Latest {limits.maxMessages} messages remembered</li>
                            <li>Conversations expire after 30 days</li>
                            <li>AI responses are based only on this interview report</li>
                            <li>Personal data outside this report is not stored</li>
                        </ul>
                        <p className="mentor-info-card__usage">
                            You're using {conversationCount} / {limits.maxConversations} conversations on this report.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MentorHeader
