import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { useCooldown } from '../hooks/useCooldown'
import { checkPasswordStrength } from '../utils/passwordStrength.js'
import { Sparkles, Loader2, AlertCircle, KeyRound, CheckCircle2 } from 'lucide-react'
import GlassCard from '../../../components/ui/GlassCard.jsx'
import FloatingInput from '../../../components/ui/FloatingInput.jsx'
import { PrimaryButton } from '../../../components/ui/Button.jsx'

// Steps: "email" -> "otp" -> "password" -> "done"
const ForgotPassword = () => {

    const navigate = useNavigate()
    const {
        loading,
        handleForgotPasswordRequestOtp,
        handleForgotPasswordVerifyOtp,
        handleResetPassword,
    } = useAuth()
    const { secondsLeft, start, isActive } = useCooldown()

    const [ step, setStep ] = useState("email")
    const [ email, setEmail ] = useState("")
    const [ otp, setOtp ] = useState("")
    const [ resetToken, setResetToken ] = useState("")
    const [ newPassword, setNewPassword ] = useState("")
    const [ confirmPassword, setConfirmPassword ] = useState("")
    const [ error, setError ] = useState("")

    const strength = checkPasswordStrength(newPassword)

    const handleRequestOtp = async (e) => {
        e.preventDefault()
        setError("")

        const result = await handleForgotPasswordRequestOtp({ email })

        if (result.success) {
            setStep("otp")
            start(60)
        } else {
            setError(result.message)
            if (result.retryAfterSeconds) start(result.retryAfterSeconds)
        }
    }

    const handleResend = async () => {
        setError("")
        const result = await handleForgotPasswordRequestOtp({ email })
        if (result.success) {
            start(60)
        } else {
            setError(result.message)
            if (result.retryAfterSeconds) start(result.retryAfterSeconds)
        }
    }

    const handleVerifyOtp = async (e) => {
        e.preventDefault()
        setError("")

        const result = await handleForgotPasswordVerifyOtp({ email, otp })

        if (result.success) {
            setResetToken(result.resetToken)
            setStep("password")
        } else {
            setError(result.message)
        }
    }

    const handleSetNewPassword = async (e) => {
        e.preventDefault()
        setError("")

        if (newPassword !== confirmPassword) {
            setError("Passwords don't match.")
            return
        }
        if (!strength.isValid) {
            setError(strength.message)
            return
        }

        const result = await handleResetPassword({ resetToken, newPassword })

        if (result.success) {
            setStep("done")
        } else {
            setError(result.message)
        }
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

                {step !== "done" && <div className="auth-card__icon-badge"><KeyRound size={22} /></div>}

                {step === "email" && (
                    <>
                        <h1>Forgot your password?</h1>
                        <p className="auth-card__subtitle">Enter your account email and we'll send you a 6-digit reset code.</p>

                        {error && <p className="auth-card__error" role="alert"><AlertCircle size={14} /> {error}</p>}

                        <form onSubmit={handleRequestOtp}>
                            <FloatingInput
                                id="email"
                                name="email"
                                type="email"
                                label="Email address"
                                onChange={(e) => { setEmail(e.target.value) }}
                                required
                            />
                            <PrimaryButton type="submit" disabled={loading} className="auth-card__submit">
                                {loading ? <Loader2 size={16} className="auth-card__spin" /> : null}
                                {loading ? "Sending code..." : "Send reset code"}
                            </PrimaryButton>
                        </form>
                    </>
                )}

                {step === "otp" && (
                    <>
                        <h1>Enter the code</h1>
                        <p className="auth-card__subtitle">We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.</p>

                        {error && <p className="auth-card__error" role="alert"><AlertCircle size={14} /> {error}</p>}

                        <form onSubmit={handleVerifyOtp}>
                            <FloatingInput
                                id="reset-otp"
                                name="reset-otp"
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
                                {loading ? "Verifying..." : "Verify code"}
                            </PrimaryButton>
                        </form>

                        <button type="button" className="auth-card__resend" onClick={handleResend} disabled={isActive}>
                            {isActive ? `Resend code in ${secondsLeft}s` : "Resend code"}
                        </button>
                    </>
                )}

                {step === "password" && (
                    <>
                        <h1>Set a new password</h1>
                        <p className="auth-card__subtitle">Choose a new password for your account.</p>

                        {error && <p className="auth-card__error" role="alert"><AlertCircle size={14} /> {error}</p>}

                        <form onSubmit={handleSetNewPassword}>
                            <div>
                                <FloatingInput
                                    id="new-password"
                                    name="new-password"
                                    type="password"
                                    label="New password"
                                    value={newPassword}
                                    onChange={(e) => { setNewPassword(e.target.value) }}
                                    required
                                />
                                {strength.message && (
                                    <p className={`auth-card__hint auth-card__hint--${strength.isValid ? "ok" : "weak"}`}>
                                        {strength.message}
                                    </p>
                                )}
                            </div>
                            <FloatingInput
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                label="Confirm new password"
                                onChange={(e) => { setConfirmPassword(e.target.value) }}
                                required
                            />
                            <PrimaryButton type="submit" disabled={loading} className="auth-card__submit">
                                {loading ? <Loader2 size={16} className="auth-card__spin" /> : null}
                                {loading ? "Saving..." : "Reset password"}
                            </PrimaryButton>
                        </form>
                    </>
                )}

                {step === "done" && (
                    <>
                        <div className="auth-card__icon-badge auth-card__icon-badge--success"><CheckCircle2 size={22} /></div>
                        <h1>Password reset</h1>
                        <p className="auth-card__subtitle">Your password has been updated. You can now log in with your new password.</p>
                        <PrimaryButton type="button" className="auth-card__submit" onClick={() => navigate('/login')}>
                            Back to login
                        </PrimaryButton>
                    </>
                )}

                {step !== "done" && (
                    <p className="auth-card__switch">Remembered your password? <Link to="/login">Log in</Link></p>
                )}
            </GlassCard>
        </main>
    )
}

export default ForgotPassword
