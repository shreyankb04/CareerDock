import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { checkPasswordStrength } from '../utils/passwordStrength.js'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import GlassCard from '../../../components/ui/GlassCard.jsx'
import FloatingInput from '../../../components/ui/FloatingInput.jsx'
import { PrimaryButton } from '../../../components/ui/Button.jsx'

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")

    const { loading, handleRegister } = useAuth()

    const strength = checkPasswordStrength(password)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const result = await handleRegister({ username, email, password })

        if (result.success) {
            // Registration no longer logs the user in directly - the account
            // needs its email verified first. Carry the email both as route
            // state (used on first load) and a query param (survives a reload
            // on the verify-email page, since state doesn't).
            navigate(`/verify-email?email=${encodeURIComponent(result.email)}`, {
                state: { email: result.email }
            })
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

                <h1>Create your account</h1>
                <p className="auth-card__subtitle">Start building AI-tailored interview strategies in minutes.</p>

                {error && (
                    <p className="auth-card__error" role="alert">
                        <AlertCircle size={14} /> {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
                    <FloatingInput
                        id="username"
                        name="username"
                        type="text"
                        label="Username"
                        onChange={(e) => { setUsername(e.target.value) }}
                        required
                    />
                    <FloatingInput
                        id="email"
                        name="email"
                        type="email"
                        label="Email address"
                        onChange={(e) => { setEmail(e.target.value) }}
                        required
                    />
                    <div>
                        <FloatingInput
                            id="password"
                            name="password"
                            type="password"
                            label="Password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value) }}
                            required
                        />
                        {strength.message && (
                            <p className={`auth-card__hint auth-card__hint--${strength.isValid ? "ok" : "weak"}`}>
                                {strength.message}
                            </p>
                        )}
                    </div>
                    <PrimaryButton type="submit" disabled={loading} className="auth-card__submit">
                        {loading ? <Loader2 size={16} className="auth-card__spin" /> : null}
                        {loading ? "Creating account..." : "Register"}
                    </PrimaryButton>
                </form>

                <p className="auth-card__switch">Already have an account? <Link to={"/login"}>Login</Link></p>
            </GlassCard>
        </main>
    )
}

export default Register
