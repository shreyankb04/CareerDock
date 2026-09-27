import "./ui.scss"

/**
 * Text input with a floating label (CSS-only, no JS state needed): the label
 * sits inside the field until the user focuses it or it has a value, then it
 * floats above. Supports an `error` message for validation states.
 */
const FloatingInput = ({ id, label, error, className = "", ...rest }) => (
    <div className={`floating-input ${error ? "floating-input--error" : ""} ${className}`}>
        <input id={id} placeholder=" " {...rest} />
        <label htmlFor={id}>{label}</label>
        {error && <span className="floating-input__error" role="alert">{error}</span>}
    </div>
)

export default FloatingInput
