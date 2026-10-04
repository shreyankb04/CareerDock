import { Route, Brain, MessageSquareText, FileEdit, Mic, BookOpen } from "lucide-react"

const PROMPTS = [
    { icon: Route, label: "Extend my roadmap to 14 days." },
    { icon: Brain, label: "Quiz me on my weakest skills." },
    { icon: MessageSquareText, label: "Explain Technical Question 4." },
    { icon: FileEdit, label: "Improve my resume." },
    { icon: Mic, label: "Start a mock interview." },
    { icon: BookOpen, label: "Give me learning resources." },
]

const SuggestedPrompts = ({ onSelect, disabled }) => (
    <div className="suggested-prompts">
        <p className="suggested-prompts__label">Try asking</p>
        <div className="suggested-prompts__grid">
            {PROMPTS.map(({ icon: Icon, label }) => (
                <button
                    key={label}
                    type="button"
                    className="suggested-prompts__chip"
                    onClick={() => onSelect(label)}
                    disabled={disabled}
                >
                    <Icon size={15} />
                    {label}
                </button>
            ))}
        </div>
    </div>
)

export default SuggestedPrompts
