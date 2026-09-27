import { Outlet, useLocation } from "react-router"
import Navbar from "./Navbar.jsx"
import Footer from "./Footer.jsx"

/**
 * Shared shell rendered around every route so the whole app gets one
 * consistent navbar, footer, and page-enter transition without every
 * individual page needing to import them.
 */
const AppLayout = () => {
    const location = useLocation()

    return (
        <div className="app-shell">
            <Navbar />
            <div className="cd-page-transition" key={location.pathname}>
                <Outlet />
            </div>
            <Footer />
        </div>
    )
}

export default AppLayout
