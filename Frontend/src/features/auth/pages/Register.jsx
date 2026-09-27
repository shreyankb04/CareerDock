import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'
import { Sparkles, Loader2 } from 'lucide-react'
import GlassCard from '../../../components/ui/GlassCard.jsx'
import FloatingInput from '../../../components/ui/FloatingInput.jsx'
import { PrimaryButton } from '../../../components/ui/Button.jsx'

const Register = () => {

    const navigate = useNavigate()
    const [ username, setUsername ] = useState("")
    const [ email, setEmail ] = useState("")
    const [ password, setPassword ] = useState("")

    const { loading, handleRegister } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        const user = await handleRegister({ username, email, password })
        if (user) {
            navigate('/')
        } else {
            alert('Registration failed. Please try again with a valid username, email, and password.')
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
                    <FloatingInput
                        id="password"
                        name="password"
                        type="password"
                        label="Password"
                        onChange={(e) => { setPassword(e.target.value) }}
                        required
                    />
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
