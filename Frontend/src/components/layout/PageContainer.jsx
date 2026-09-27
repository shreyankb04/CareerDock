import "./PageContainer.scss"

/**
 * Centers content with the app's standard max-width (1280px) and consistent
 * horizontal padding across breakpoints. Use for every page's top-level content.
 */
const PageContainer = ({ children, className = "", as: Tag = "div", narrow = false }) => (
    <Tag className={`page-container ${narrow ? "page-container--narrow" : ""} ${className}`}>
        {children}
    </Tag>
)

export default PageContainer
