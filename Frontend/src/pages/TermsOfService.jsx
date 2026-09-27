import PageContainer from "../components/layout/PageContainer.jsx"
import GlassCard from "../components/ui/GlassCard.jsx"
import SectionTitle from "../components/ui/SectionTitle.jsx"
import "./legal.scss"

const SECTIONS = [
    {
        title: "Use of Platform",
        body: [
            "CareerDock is an AI-powered interview preparation tool. By using it, you agree to provide accurate information and to use the platform only for lawful, personal career-preparation purposes.",
        ],
    },
    {
        title: "AI Generated Responses Disclaimer",
        body: [
            "Interview questions, model answers, match scores, skill-gap assessments, and preparation plans are generated automatically by AI based on the information you provide.",
            "This content is for preparation purposes only. CareerDock does not guarantee the accuracy, completeness, or interview outcomes resulting from AI-generated content, and it should not be treated as professional career, legal, or hiring advice.",
        ],
    },
    {
        title: "User Responsibilities",
        body: [
            "You are responsible for the accuracy of the job descriptions, resumes, and self-descriptions you submit, and for keeping your account credentials confidential.",
            "You agree not to misuse the platform, attempt to disrupt its operation, or upload content you don't have the right to share.",
        ],
    },
    {
        title: "Data Usage",
        body: [
            "Information you submit (job descriptions, resume text, self-descriptions) is used to generate your interview reports and is stored so you can access your report history. See our Privacy Policy for full details.",
        ],
    },
    {
        title: "Account Security",
        body: [
            "You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account. Notify us promptly if you suspect unauthorized access.",
        ],
    },
    {
        title: "Contact Information",
        body: [
            "Questions about these terms can be directed to our Help Center or sent to us by email.",
        ],
    },
]

const TermsOfService = () => (
    <main className="legal-page">
        <PageContainer narrow>
            <SectionTitle
                eyebrow="Legal"
                title="Terms of Service"
                subtitle="The terms that govern your use of CareerDock."
            />

            <p className="legal-page__updated">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>

            <div className="legal-page__sections">
                {SECTIONS.map((section) => (
                    <GlassCard key={section.title} className="legal-section">
                        <h3>{section.title}</h3>
                        {section.body.map((paragraph, i) => (
                            <p key={i}>{paragraph}</p>
                        ))}
                    </GlassCard>
                ))}
            </div>

            <p className="legal-page__disclaimer">
                This page is provided as a general template and does not constitute legal advice. If you operate CareerDock
                commercially, please have these terms reviewed by legal counsel for your jurisdiction.
            </p>
        </PageContainer>
    </main>
)

export default TermsOfService
