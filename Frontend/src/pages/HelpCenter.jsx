import { useState } from "react"
import { Mail, ChevronDown, LifeBuoy } from "lucide-react"
import PageContainer from "../components/layout/PageContainer.jsx"
import GlassCard from "../components/ui/GlassCard.jsx"
import SectionTitle from "../components/ui/SectionTitle.jsx"
import "./HelpCenter.scss"

const SUPPORT_MAILTO = "mailto:borawakeshreyank@gmail.com?subject=CareerDock%20Support&body=Hello%20CareerDock%20Team%2C%0D%0A%0D%0A"

const FAQS = [
    {
        question: "How do I upload my resume?",
        answer: "On the Home page, open the \"Your Profile\" section and either drag & drop your resume file onto the upload area or click it to choose a file from your device.",
    },
    {
        question: "What resume formats are supported?",
        answer: "PDF resumes are fully supported and give the most reliable results, since CareerDock reads the text directly from the PDF. DOCX upload is present in the picker but full parsing support is still being rolled out - for best results, upload a PDF for now.",
    },
    {
        question: "Why isn't AI generating questions?",
        answer: "Make sure you've filled in a Target Job Description and provided either a resume or a self-description - both are required. Generation typically takes about 30 seconds; if it still fails, check your internet connection and try again, or contact support below.",
    },
    {
        question: "How do recommendations work?",
        answer: "CareerDock's AI analyzes your resume/self-description against the job description to produce a match score, a list of skill gaps, and a day-by-day preparation roadmap - these make up your personalized recommendations, all included in your generated interview report.",
    },
    {
        question: "How do I report a bug?",
        answer: "Use the \"Email Support\" button above - it opens your email client with our support address and subject pre-filled so you can describe the issue directly.",
    },
]

const FaqItem = ({ question, answer, isOpen, onToggle }) => (
    <div className={`faq-item ${isOpen ? "faq-item--open" : ""}`}>
        <button className="faq-item__trigger" onClick={onToggle} aria-expanded={isOpen}>
            <span>{question}</span>
            <ChevronDown size={18} className="faq-item__chevron" />
        </button>
        <div className="faq-item__panel">
            <p>{answer}</p>
        </div>
    </div>
)

const HelpCenter = () => {
    const [ openIndex, setOpenIndex ] = useState(0)

    return (
        <main className="help-center">
            <PageContainer narrow>
                <SectionTitle
                    eyebrow="Support"
                    title="Help Center"
                    subtitle="Get help with your account, resume uploads, or interview strategy generation."
                />

                <GlassCard className="support-card">
                    <div className="support-card__icon"><LifeBuoy size={22} /></div>
                    <div className="support-card__text">
                        <h3>Contact Support</h3>
                        <p>Can't find what you're looking for? Our team is happy to help directly.</p>
                    </div>
                    <a href={SUPPORT_MAILTO} className="button primary-button support-card__cta">
                        <Mail size={16} /> Email Support
                    </a>
                </GlassCard>

                <div className="help-center__faq">
                    <h3 className="help-center__faq-title">Frequently Asked Questions</h3>
                    <div className="faq-list">
                        {FAQS.map((faq, index) => (
                            <FaqItem
                                key={faq.question}
                                question={faq.question}
                                answer={faq.answer}
                                isOpen={openIndex === index}
                                onToggle={() => setOpenIndex((current) => (current === index ? -1 : index))}
                            />
                        ))}
                    </div>
                </div>
            </PageContainer>
        </main>
    )
}

export default HelpCenter
