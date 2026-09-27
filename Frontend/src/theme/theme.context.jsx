import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext()

const STORAGE_KEY = "careerdock-theme"

function getInitialTheme() {
    if (typeof window === "undefined") return "dark"
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark") return stored
    // CareerDock's brand identity is dark-first (matches the product mockup),
    // so we only fall back to the system preference when nothing is stored.
    const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches
    return prefersLight ? "light" : "dark"
}

export const ThemeProvider = ({ children }) => {
    const [ theme, setTheme ] = useState(getInitialTheme)

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme)
        window.localStorage.setItem(STORAGE_KEY, theme)
    }, [ theme ])

    const toggleTheme = () => {
        setTheme((current) => (current === "dark" ? "light" : "dark"))
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => useContext(ThemeContext)
