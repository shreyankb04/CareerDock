import PageContainer from "../components/layout/PageContainer.jsx"
import GlassCard from "../components/ui/GlassCard.jsx"
import SectionTitle from "../components/ui/SectionTitle.jsx"
import "./legal.scss"

const SECTIONS = [
    {
        title: "Information We Collect",
        body: [
            "When you create a CareerDock account we collect your username, email address, and password (stored hashed, never in plain text).",
            "When you generate an interview strategy, we collect the job description you paste in, the self-description you write, and, if you choose to upload one, the text content of your resume.",
        ],
    },
    {
        title: "Resume Data Handling",
        body: [
            "Resumes are only processed for the purpose of interview preparation. When you upload a resume PDF, we extract its text content to build your personalized report - we do not sell, share, or use your resume for any purpose beyond generating and storing the interview strategy you requested.",
            "Extracted resume text is stored alongside your generated report in our database so you can revisit past reports without re-uploading your resume.",
        ],
    },
    {
        title: "AI Generated Content",
        body: [
            "Interview questions, model answers, skill-gap analysis, and preparation plans are generated using Google's Gemini AI models based on the job description, resume text, and self-description you provide.",
            "AI-generated content is produced automatically and, like any AI output, may occasionally be inaccurate or incomplete. Use your own judgement when preparing for an actual interview.",
        ],
    },
    {
        title: "Authentication & Security",
        body: [
            "CareerDock uses JSON Web Tokens (JWT) delivered via secure cookies to keep you signed in. Passwords are hashed before storage and are never stored or transmitted in plain text.",
            "We take reasonable technical measures to protect your data, but no online service can guarantee absolute security.",
        ],
    },
    {
        title: "Cookies",
        body: [
            "We use a small number of essential cookies to keep you signed in between visits. We do not use third-party advertising or tracking cookies.",
        ],
    },
    {
        title: "Contact",
        body: [
            "If you have questions about this policy or how your data is handled, reach out via our Help Center or email us directly.",
        ],
    },
]

const PrivacyPolicy = () => (
    <main className="legal-page">
        <PageContainer narrow>
            <SectionTitle
                eyebrow="Legal"
                title="Privacy Policy"
                subtitle="How CareerDock collects, uses, and protects your information."
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
                commercially, please have this policy reviewed by legal counsel for your jurisdiction.
            </p>
        </PageContainer>
    </main>
)

export default PrivacyPolicy
