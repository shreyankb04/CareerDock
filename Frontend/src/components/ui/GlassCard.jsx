import "./ui.scss"

/**
 * A semi-transparent, dark-glass card with a soft border and rounded corners.
 * `hover` enables the subtle lift-on-hover micro-interaction used for feature/
 * clickable cards; leave it off for static content cards.
 */
const GlassCard = ({ children, className = "", hover = false, as: Tag = "div", ...rest }) => (
    <Tag className={`glass-card ${hover ? "glass-card--hover" : ""} ${className}`} {...rest}>
        {children}
    </Tag>
)

export default GlassCard
