import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import {
    login, register, logout, getMe,
    verifyEmail, resendOtp,
    forgotPasswordRequestOtp, forgotPasswordVerifyOtp, resetPassword,
} from "../services/auth.api";

// Pulls a friendly message + any extra fields (needsVerification, retryAfterSeconds)
// off an axios error response. Every handler below uses this so the frontend can
// react to specific server responses instead of only knowing "it failed".
function parseError(err) {
    const data = err?.response?.data
    return {
        message: data?.message || "Something went wrong. Please try again.",
        needsVerification: data?.needsVerification ?? false,
        retryAfterSeconds: data?.retryAfterSeconds ?? null,
    }
}

export const useAuth = () => {

    const context = useContext(AuthContext)
    const { user, setUser, loading, setLoading } = context

    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        try {
            const data = await login({ email, password })
            setUser(data.user)
            return { success: true, user: data.user }
        } catch (err) {
            setUser(null)
            return { success: false, ...parseError(err) }
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        try {
            // Registration no longer creates a session - the account must be
            // verified first, so there's nothing to setUser() here yet.
            const data = await register({ username, email, password })
            return { success: true, email: data.email }
        } catch (err) {
            return { success: false, ...parseError(err) }
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyEmail = async ({ email, otp }) => {
        setLoading(true)
        try {
            const data = await verifyEmail({ email, otp })
            setUser(data.user)
            return { success: true, user: data.user }
        } catch (err) {
            return { success: false, ...parseError(err) }
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async ({ email }) => {
        try {
            const data = await resendOtp({ email })
            return { success: true, message: data.message }
        } catch (err) {
            return { success: false, ...parseError(err) }
        }
    }

    const handleLogout = async () => {
        setLoading(true)
        try {
            await logout()
            setUser(null)
        } catch (err) {
            console.log(err)
        }
        finally {
            setLoading(false)
        }
    }

    const handleForgotPasswordRequestOtp = async ({ email }) => {
        try {
            const data = await forgotPasswordRequestOtp({ email })
            return { success: true, message: data.message }
        } catch (err) {
            return { success: false, ...parseError(err) }
        }
    }

    const handleForgotPasswordVerifyOtp = async ({ email, otp }) => {
        try {
            const data = await forgotPasswordVerifyOtp({ email, otp })
            return { success: true, resetToken: data.resetToken }
        } catch (err) {
            return { success: false, ...parseError(err) }
        }
    }

    const handleResetPassword = async ({ resetToken, newPassword }) => {
        setLoading(true)
        try {
            const data = await resetPassword({ resetToken, newPassword })
            return { success: true, message: data.message }
        } catch (err) {
            return { success: false, ...parseError(err) }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {

        const getandSetUser = async () => {
            try {
                const data = await getMe()
                setUser(data?.user ?? null)
            } catch (err) {
                console.log(err)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        getandSetUser()
    }, [setLoading, setUser])

    return {
        user, loading,
        handleRegister, handleLogin, handleLogout,
        handleVerifyEmail, handleResendOtp,
        handleForgotPasswordRequestOtp, handleForgotPasswordVerifyOtp, handleResetPassword,
    }
}
