// Thin, opinionated wrapper around the app's shared `.button` styles
// (see src/styles/button.scss). Exists so pages can import a component
// instead of remembering class name combinations.

export const PrimaryButton = ({ children, className = "", ...rest }) => (
    <button className={`button primary-button ${className}`} {...rest}>
        {children}
    </button>
)

export const SecondaryButton = ({ children, className = "", ...rest }) => (
    <button className={`button secondary-button ${className}`} {...rest}>
        {children}
    </button>
)
