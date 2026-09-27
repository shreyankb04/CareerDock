import { Sun, Moon } from "lucide-react"
import { useTheme } from "../../theme/theme.context.jsx"
import "./ThemeToggle.scss"

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme()
    const isLight = theme === "light"

    return (
        <button
            type="button"
            className="theme-toggle"
            role="switch"
            aria-checked={isLight}
            aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            onClick={toggleTheme}
        >
            <span className="theme-toggle__icon theme-toggle__icon--moon"><Moon size={13} /></span>
            <span className="theme-toggle__icon theme-toggle__icon--sun"><Sun size={13} /></span>
            <span className="theme-toggle__thumb" />
        </button>
    )
}

export default ThemeToggle
