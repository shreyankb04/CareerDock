import { Link } from "react-router"
import { Sparkles } from "lucide-react"
import PageContainer from "./PageContainer.jsx"
import "./Footer.scss"

const FOOTER_LINKS = [
    { to: "/privacy-policy", label: "Privacy Policy" },
    { to: "/terms-of-service", label: "Terms of Service" },
    { to: "/help-center", label: "Help Center" },
    { to: "/ai-status", label: "AI Status" },
]

const Footer = () => (
    <footer className="site-footer">
        <PageContainer className="site-footer__inner">
            <div className="site-footer__brand">
                <span className="site-footer__brand-name">
                    <Sparkles size={16} /> CareerDock
                </span>
                <p className="site-footer__tagline">AI Engineered for Elite Professionals</p>
            </div>

            <nav className="site-footer__links" aria-label="Footer">
                {FOOTER_LINKS.map(({ to, label }) => (
                    <Link key={to} to={to} className="site-footer__link">{label}</Link>
                ))}
            </nav>

            <p className="site-footer__copyright">&copy; {new Date().getFullYear()} CareerDock. All rights reserved.</p>
        </PageContainer>
    </footer>
)

export default Footer
