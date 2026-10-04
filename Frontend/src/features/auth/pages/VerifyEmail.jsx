import React, { useState } from 'react'
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { useCooldown } from '../hooks/useCooldown'
import { Sparkles, Loader2, AlertCircle, MailCheck } from 'lucide-react'
import GlassCard from '../../../components/ui/GlassCard.jsx'
import FloatingInput from '../../../components/ui/FloatingInput.jsx'
import { PrimaryButton } from '../../../components/ui/Button.jsx'

const VerifyEmail = () => {

    const navigate = useNavigate()
    const location = useLocation()
    const [ searchParams ] = useSearchParams()

    // location.state survives the redirect from Register/Login; the query
    // param is the fallback so a page reload (which drops state) still works.
    const email = location.state?.email || searchParams.get('email') || ""

    const [ otp, setOtp ] = useState("")
    const [ error, setError ] = useState("")
    const [ info, setInfo ] = useState("")

    const { loading, handleVerifyEmail, handleResendOtp } = useAuth()
    const { secondsLeft, start, isActive } = useCooldown()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setInfo("")

        const result = await handleVerifyEmail({ email, otp })

        if (result.success) {
            navigate('/')
        } else {
            setError(result.message)
        }
    }

    const handleResend = async () => {
        setError("")
        setInfo("")

        const result = await handleResendOtp({ email })

        if (result.success) {
            setInfo("A new code has been sent to your email.")
            start(60)
        } else {
            setError(result.message)
            if (result.retryAfterSeconds) start(result.retryAfterSeconds)
        }
    }

    if (!email) {
        return (
            <main className="auth-page">
                <GlassCard className="auth-card">
                    <p className="auth-card__error" role="alert">
                        <AlertCircle size={14} /> We couldn't find an email to verify. Please register or log in again.
                    </p>
                    <p className="auth-card__switch"><Link to="/register">Back to register</Link></p>
                </GlassCard>
            </main>
        )
    }

    return (
        <main className="auth-page">
            <div className='auth-glow auth-glow--one' aria-hidden='true' />
            <div className='auth-glow auth-glow--two' aria-hidden='true' />

            <GlassCard className="auth-card">
                <div className="auth-card__brand">
                    <span className="auth-card__brand-icon"><Sparkles size={18} /></span>
                    CareerDock
                </div>

                <div className="auth-card__icon-badge"><MailCheck size={22} /></div>

                <h1>Verify your email</h1>
                <p className="auth-card__subtitle">
                    Enter the 6-digit code we sent to <strong>{email}</strong>. It expires in 10 minutes.
                </p>

                {error && (
                    <p className="auth-card__error" role="alert">
                        <AlertCircle size={14} /> {error}
                    </p>
                )}
                {info && !error && (
                    <p className="auth-card__info">{info}</p>
                )}

                <form onSubmit={handleSubmit}>
                    <FloatingInput
                        id="otp"
                        name="otp"
                        type="text"
                        label="6-digit code"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)) }}
                        required
                    />
                    <PrimaryButton type="submit" disabled={loading || otp.length !== 6} className="auth-card__submit">
                        {loading ? <Loader2 size={16} className="auth-card__spin" /> : null}
                        {loading ? "Verifying..." : "Verify Email"}
                    </PrimaryButton>
                </form>

                <button type="button" className="auth-card__resend" onClick={handleResend} disabled={isActive}>
                    {isActive ? `Resend code in ${secondsLeft}s` : "Resend code"}
                </button>

                <p className="auth-card__switch">Wrong email? <Link to="/register">Start over</Link></p>
            </GlassCard>
        </main>
    )
}

export default VerifyEmail
