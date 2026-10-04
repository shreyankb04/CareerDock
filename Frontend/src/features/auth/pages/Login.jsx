import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { Sparkles, Loader2, AlertCircle } from 'lucide-react'
import GlassCard from '../../../components/ui/GlassCard.jsx'
import FloatingInput from '../../../components/ui/FloatingInput.jsx'
import { PrimaryButton } from '../../../components/ui/Button.jsx'

const Login = () => {

    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")
    const [ error, setError ] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")

        const result = await handleLogin({ email, password })

        if (result.success) {
            navigate('/')
        } else if (result.needsVerification) {
            // Account exists but hasn't verified its email yet - send them
            // straight to the verify-email page instead of a dead-end error.
            navigate(`/verify-email?email=${encodeURIComponent(result.email || email)}`, {
                state: { email: result.email || email }
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

                <h1>Welcome back</h1>
                <p className="auth-card__subtitle">Sign in to continue building your interview strategy.</p>

                {error && (
                    <p className="auth-card__error" role="alert">
                        <AlertCircle size={14} /> {error}
                    </p>
                )}

                <form onSubmit={handleSubmit}>
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
                            onChange={(e) => { setPassword(e.target.value) }}
                            required
                        />
                        <Link to="/forgot-password" className="auth-card__forgot-link">Forgot password?</Link>
                    </div>
                    <PrimaryButton type="submit" disabled={loading} className="auth-card__submit">
                        {loading ? <Loader2 size={16} className="auth-card__spin" /> : null}
                        {loading ? "Signing in..." : "Login"}
                    </PrimaryButton>
                </form>

                <p className="auth-card__switch">Don't have an account? <Link to={"/register"}>Register</Link></p>
            </GlassCard>
        </main>
    )
}

export default Login
