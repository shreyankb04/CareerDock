import { useState } from "react"
import { Link, useNavigate } from "react-router"
import { Menu, X, Sparkles, User, LogOut, Activity, Home as HomeIcon } from "lucide-react"
import { useAuth } from "../../features/auth/hooks/useAuth.js"
import ThemeToggle from "../ui/ThemeToggle.jsx"
import PageContainer from "./PageContainer.jsx"
import "./Navbar.scss"

// NOTE: the design brief asked for Home / Dashboard / Library / About / AI Status.
// This codebase currently only has real destinations for Home ("/") and the new
// AI Status page ("/ai-status") - Dashboard/Library/About don't exist yet and
// weren't specified, so rather than ship dead links we only wire up real pages.
// Add entries here once those pages exist.
const NAV_LINKS = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/ai-status", label: "AI Status", icon: Activity },
]

const Navbar = () => {
    const [ isDrawerOpen, setDrawerOpen ] = useState(false)
    const { user, handleLogout } = useAuth()
    const navigate = useNavigate()

    const closeDrawer = () => setDrawerOpen(false)

    const onLogout = async () => {
        closeDrawer()
        await handleLogout()
        navigate("/login")
    }

    return (
        <header className="navbar">
            <PageContainer className="navbar__inner">
                <Link to="/" className="navbar__brand" onClick={closeDrawer}>
                    <span className="navbar__brand-icon"><Sparkles size={18} /></span>
                    CareerDock
                </Link>

                <nav className="navbar__links navbar__links--desktop" aria-label="Primary">
                    {NAV_LINKS.map(({ to, label }) => (
                        <Link key={to} to={to} className="navbar__link">{label}</Link>
                    ))}
                </nav>

                <div className="navbar__actions navbar__actions--desktop">
                    <ThemeToggle />
                    {user ? (
                        <button className="navbar__profile" onClick={onLogout} aria-label="Log out">
                            <User size={15} />
                            <span>{user.username}</span>
                            <LogOut size={14} />
                        </button>
                    ) : (
                        <Link to="/login" className="button primary-button navbar__signin">Sign In</Link>
                    )}
                </div>

                <button
                    className="navbar__hamburger"
                    aria-label={isDrawerOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isDrawerOpen}
                    onClick={() => setDrawerOpen((open) => !open)}
                >
                    {isDrawerOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </PageContainer>

            {/* Mobile slide-out drawer */}
            <div className={`navbar__drawer-overlay ${isDrawerOpen ? "navbar__drawer-overlay--open" : ""}`} onClick={closeDrawer} />
            <aside className={`navbar__drawer ${isDrawerOpen ? "navbar__drawer--open" : ""}`} aria-hidden={!isDrawerOpen}>
                <nav className="navbar__drawer-links" aria-label="Mobile">
                    {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                        <Link key={to} to={to} className="navbar__drawer-link" onClick={closeDrawer}>
                            <Icon size={18} />
                            {label}
                        </Link>
                    ))}
                </nav>

                <div className="navbar__drawer-footer">
                    <div className="navbar__drawer-theme">
                        <span>Appearance</span>
                        <ThemeToggle />
                    </div>
                    {user ? (
                        <button className="button secondary-button navbar__drawer-btn" onClick={onLogout}>
                            <LogOut size={16} /> Log Out
                        </button>
                    ) : (
                        <Link to="/login" className="button primary-button navbar__drawer-btn" onClick={closeDrawer}>
                            Sign In
                        </Link>
                    )}
                </div>
            </aside>
        </header>
    )
}

export default Navbar
