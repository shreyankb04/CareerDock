import "./ui.scss"

/**
 * Consistent section heading used across pages: an optional pink eyebrow
 * label, a large bold title, and an optional supporting subtitle.
 */
const SectionTitle = ({ eyebrow, title, subtitle, align = "left", className = "" }) => (
    <div className={`section-title section-title--${align} ${className}`}>
        {eyebrow && <span className="section-title__eyebrow">{eyebrow}</span>}
        <h2 className="section-title__title">{title}</h2>
        {subtitle && <p className="section-title__subtitle">{subtitle}</p>}
    </div>
)

export default SectionTitle
