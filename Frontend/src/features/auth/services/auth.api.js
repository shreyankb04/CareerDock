import { api } from "../../../lib/apiClient.js"

export async function register({ username, email, password }) {
    const response = await api.post('/api/auth/register', { username, email, password })
    return response.data
}

export async function verifyEmail({ email, otp }) {
    const response = await api.post('/api/auth/verify-email', { email, otp })
    return response.data
}

export async function resendOtp({ email }) {
    const response = await api.post('/api/auth/resend-otp', { email })
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", { email, password })
    return response.data
}

export async function logout() {
    const response = await api.get("/api/auth/logout")
    return response.data
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}

export async function forgotPasswordRequestOtp({ email }) {
    const response = await api.post('/api/auth/forgot-password/request-otp', { email })
    return response.data
}

export async function forgotPasswordVerifyOtp({ email, otp }) {
    const response = await api.post('/api/auth/forgot-password/verify-otp', { email, otp })
    return response.data
}

export async function resetPassword({ resetToken, newPassword }) {
    const response = await api.post('/api/auth/forgot-password/reset', { resetToken, newPassword })
    return response.data
}
