import { useState, useRef } from 'react'
import "../style/home.scss"
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate } from 'react-router'
import { Briefcase, User, UploadCloud, Info, Sparkles, Brain, Code2, Route } from 'lucide-react'
import GradientBadge from '../../../components/ui/GradientBadge.jsx'
import GlassCard from '../../../components/ui/GlassCard.jsx'

const FEATURES = [
    {
        icon: Brain,
        title: 'Psychological Profiling',
        description: 'Our AI analyzes interviewer archetypes and predicts behavioral questions based on corporate culture.',
    },
    {
        icon: Code2,
        title: 'Technical Deep-Dive',
        description: 'Get custom-tailored coding and architectural challenges specific to the tech stack in the job.',
    },
    {
        icon: Route,
        title: 'Dynamic Roadmaps',
        description: 'Receive a step-by-step preparation timeline from now until your scheduled interview date.',
    },
]

const Home = () => {

    const { loading, generateReport, reports } = useInterview()
    const [ jobDescription, setJobDescription ] = useState("")
    const [ selfDescription, setSelfDescription ] = useState("")
    const [ resumeFile, setResumeFile ] = useState(null)
    const [ resumeName, setResumeName ] = useState("")
    const [ isDragging, setIsDragging ] = useState(false)
    const resumeInputRef = useRef()

    const navigate = useNavigate()

    const handleGenerateReport = async () => {
        if (!resumeFile && !selfDescription.trim()) {
            alert('Please upload a resume or enter a self description to generate your interview strategy.')
            return
        }

        const data = await generateReport({ jobDescription, selfDescription, resumeFile })
        if (data?._id) {
            navigate(`/interview/${data._id}`)
        } else {
            alert('Unable to generate interview strategy. Please try again.')
        }
    }

    const handleFileChange = (event) => {
        const file = event.target.files?.[0] ?? null
        setResumeFile(file)
        setResumeName(file?.name ?? "")
    }

    const handleDrop = (event) => {
        event.preventDefault()
        setIsDragging(false)
        const file = event.dataTransfer.files?.[0] ?? null
        if (file) {
            setResumeFile(file)
            setResumeName(file.name)
        }
    }

    const formatFileSize = (bytes) => {
        if (!bytes) return ""
        const kb = bytes / 1024
        return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
    }

    if (loading) {
        return (
            <main className='cd-loading-screen'>
                <span className='cd-spinner' />
                <h1>Loading your interview plan...</h1>
            </main>
        )
    }

    return (
        <main className='home-page'>

            {/* Animated background blobs */}
            <div className='hero-glow hero-glow--one' aria-hidden='true' />
            <div className='hero-glow hero-glow--two' aria-hidden='true' />

            {/* Hero Section */}
            <section className='hero'>
                <h1 className='hero__title'>Master Your Next Interview <span className='highlight'>with AI</span></h1>
                <p className='hero__subtitle'>
                    Tailored strategy engineered for elite professionals. Let CareerDock analyze the job requirements
                    and your unique profile to build a winning formula.
                </p>
            </section>

            {/* Main Card */}
            <div className='interview-card'>

                <div className='interview-card__intro'>
                    <div>
                        <h2>Create Your Custom <span className='highlight'>Interview Plan</span></h2>
                        <p>Ready to dock. Input your parameters below.</p>
                    </div>
                    <GradientBadge icon={<Sparkles size={12} />}>AI Engine Ready</GradientBadge>
                </div>

                <div className='interview-card__body'>

                    {/* Left Panel - Job Description */}
                    <div className='panel panel--left'>
                        <div className='panel__header'>
                            <span className='panel__icon'><Briefcase size={18} /></span>
                            <h2>Target Job Description</h2>
                            <span className='badge badge--required'>Required</span>
                        </div>
                        <textarea
                            value={jobDescription}
                            onChange={(e) => { setJobDescription(e.target.value) }}
                            className='panel__textarea'
                            placeholder={`Paste the full job description here...\ne.g. 'Senior Frontend Engineer at Google requires proficiency in React, TypeScript, and large-scale system design...'`}
                            maxLength={5000}
                        />
                        <div className='char-counter'>{jobDescription.length} / 5000 chars</div>
                    </div>

                    {/* Vertical Divider */}
                    <div className='panel-divider' />

                    {/* Right Panel - Profile */}
                    <div className='panel panel--right'>
                        <div className='panel__header'>
                            <span className='panel__icon'><User size={18} /></span>
                            <h2>Your Profile</h2>
                        </div>

                        {/* Upload Resume */}
                        <div className='upload-section'>
                            <label className='section-label'>
                                Upload Resume
                                <span className='badge badge--best'>Best Results</span>
                            </label>
                            <label
                                className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
                                htmlFor='resume'
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                            >
                                <span className='dropzone__icon'><UploadCloud size={28} /></span>
                                <p className='dropzone__title'>Click to upload or drag &amp; drop</p>
                                <p className='dropzone__subtitle'>PDF or DOCX (Max 5MB)</p>
                                <input ref={resumeInputRef} hidden type='file' id='resume' name='resume' accept='.pdf,.docx' onChange={handleFileChange} />
                                {resumeName && (
                                    <span className='dropzone__file'>
                                        {resumeName}
                                        {resumeFile?.size ? <span className='dropzone__file-size'>{formatFileSize(resumeFile.size)}</span> : null}
                                    </span>
                                )}
                            </label>
                        </div>

                        {/* OR Divider */}
                        <div className='or-divider'><span>OR</span></div>

                        {/* Quick Self-Description */}
                        <div className='self-description'>
                            <label className='section-label' htmlFor='selfDescription'>Quick Self-Description</label>
                            <textarea
                                onChange={(e) => { setSelfDescription(e.target.value) }}
                                id='selfDescription'
                                name='selfDescription'
                                className='panel__textarea panel__textarea--short'
                                placeholder="Briefly describe your experience, key skills, and years of experience if you don't have a resume handy..."
                            />
                        </div>

                        {/* Info Box */}
                        <div className='info-box'>
                            <span className='info-box__icon'><Info size={16} /></span>
                            <p>Either a <strong>Resume</strong> or a <strong>Self Description</strong> is required to generate a personalized plan.</p>
                        </div>
                    </div>
                </div>

                {/* Card Footer */}
                <div className='interview-card__footer'>
                    <span className='footer-info'>AI-Powered Strategy Generation &bull; Approx 30s</span>
                    <button
                        onClick={handleGenerateReport}
                        className='button primary-button generate-btn'>
                        <Sparkles size={16} />
                        Generate My Interview Strategy
                    </button>
                </div>
            </div>

            {/* Recent Reports List */}
            {reports.length > 0 && (
                <section className='recent-reports'>
                    <h2>My Recent Interview Plans</h2>
                    <ul className='reports-list'>
                        {reports.map(report => (
                            <li key={report._id} className='report-item' onClick={() => navigate(`/interview/${report._id}`)}>
                                <h3>{report.title || 'Untitled Position'}</h3>
                                <p className='report-meta'>Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                                <p className={`match-score ${report.matchScore >= 80 ? 'score--high' : report.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>Match Score: {report.matchScore}%</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Feature Cards */}
            <section className='feature-grid'>
                {FEATURES.map(({ icon: Icon, title, description }) => (
                    <GlassCard key={title} hover className='feature-card'>
                        <span className='feature-card__icon'><Icon size={22} /></span>
                        <h3>{title}</h3>
                        <p>{description}</p>
                    </GlassCard>
                ))}
            </section>
        </main>
    )
}

export default Home
