import "./ui.scss"

/**
 * Small pill-shaped badge with the brand gradient outline, used for labels
 * like "AI Engine Ready", "Required", "Best Results", status tags, etc.
 * `tone` swaps the accent color for semantic states.
 */
const GradientBadge = ({ children, icon, tone = "brand", className = "" }) => (
    <span className={`gradient-badge gradient-badge--${tone} ${className}`}>
        {icon && <span className="gradient-badge__icon">{icon}</span>}
        {children}
    </span>
)

export default GradientBadge
