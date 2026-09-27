import { Sparkles, FileText, Brain, Shield, Database, Lightbulb } from "lucide-react"
import PageContainer from "../components/layout/PageContainer.jsx"
import GlassCard from "../components/ui/GlassCard.jsx"
import SectionTitle from "../components/ui/SectionTitle.jsx"
import GradientBadge from "../components/ui/GradientBadge.jsx"
import "./AiStatus.scss"

// Mock service states for now, as requested - not wired to real monitoring yet.
const SERVICES = [
    { name: "Gemini AI API", description: "Powers question, answer, and roadmap generation.", status: "operational", icon: Sparkles },
    { name: "Resume Analyzer", description: "Extracts and reads text from uploaded resume PDFs.", status: "operational", icon: FileText },
    { name: "Interview Generator", description: "Builds structured technical & behavioral question sets.", status: "operational", icon: Brain },
    { name: "Authentication", description: "Handles sign-in, sign-up, and session security.", status: "operational", icon: Shield },
    { name: "Database", description: "Stores accounts and interview report history.", status: "operational", icon: Database },
    { name: "Recommendation Engine", description: "Surfaces skill gaps and prep-plan recommendations.", status: "degraded", icon: Lightbulb },
]

const STATUS_META = {
    operational: { label: "Operational", tone: "success" },
    degraded: { label: "Degraded", tone: "warning" },
    offline: { label: "Offline", tone: "error" },
}

const AiStatus = () => {
    const lastUpdated = new Date().toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
    })

    return (
        <main className="ai-status">
            <PageContainer>
                <SectionTitle
                    align="center"
                    eyebrow="System Status"
                    title="CareerDock AI Status"
                    subtitle="Live-style overview of the services that power your interview strategy generation."
                />

                <p className="ai-status__updated">Last updated: {lastUpdated}</p>

                <div className="ai-status__grid">
                    {SERVICES.map(({ name, description, status, icon: Icon }) => {
                        const meta = STATUS_META[status]
                        return (
                            <GlassCard key={name} className="status-card">
                                <div className="status-card__top">
                                    <span className="status-card__icon"><Icon size={20} /></span>
                                    <GradientBadge tone={meta.tone}>{meta.label}</GradientBadge>
                                </div>
                                <h3>{name}</h3>
                                <p>{description}</p>
                            </GlassCard>
                        )
                    })}
                </div>

                <p className="ai-status__note">
                    Status shown here is illustrative for now and isn't yet wired to live infrastructure monitoring.
                </p>
            </PageContainer>
        </main>
    )
}

export default AiStatus
