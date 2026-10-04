const { Resend } = require("resend")

// Must be on a domain verified in Resend, e.g. "CareerDock <noreply@careerdocks.in>".
const EMAIL_FROM = process.env.EMAIL_FROM || "CareerDock <noreply@careerdocks.in>"
const EMAIL_FAILED_MESSAGE = "We couldn't send the email right now. Please try again in a few minutes."

let client = null
function getClient() {
    if (!process.env.RESEND_API_KEY) return null
    if (!client) client = new Resend(process.env.RESEND_API_KEY)
    return client
}

function emailFailedError() {
    const err = new Error(EMAIL_FAILED_MESSAGE)
    err.statusCode = 503
    return err
}

/**
 * Sends one email and THROWS a controlled 503 if it didn't go out. The Resend SDK
 * does not throw on API failures (unverified domain, bad key, rate limit): it resolves
 * with { data, error }. The old code ignored that, telling users "code sent" when
 * nothing was sent. Provider errors are logged, never returned to the client.
 */
async function sendEmail({ to, subject, html }) {
    const resend = getClient()
    if (!resend) {
        console.error("[email] RESEND_API_KEY is not set.")
        throw emailFailedError()
    }
    let result
    try {
        result = await resend.emails.send({ from: EMAIL_FROM, to, subject, html })
    } catch (err) {
        console.error("[email] send threw:", err?.message)
        throw emailFailedError()
    }
    if (result?.error) {
        console.error("[email] Resend rejected the email:", {
            name: result.error.name,
            statusCode: result.error.statusCode,
            message: result.error.message,
        })
        throw emailFailedError()
    }
    return result?.data
}

function otpEmailHtml({ heading, intro, otp }) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #111827;">${heading}</h2>
        <p style="color: #4b5563; font-size: 14px;">${intro}</p>
        <div style="text-align:center; margin: 24px 0;">
            <span style="display:inline-block; font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #111827; background: #f3f4f6; padding: 12px 20px; border-radius: 8px;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
    `
}

async function sendVerificationOTPEmail({ to, otp }) {
    return sendEmail({
        to,
        subject: "Verify your CareerDock account",
        html: otpEmailHtml({ heading: "Verify your email", intro: "Use the code below to verify your CareerDock account.", otp }),
    })
}

async function sendPasswordResetOTPEmail({ to, otp }) {
    return sendEmail({
        to,
        subject: "Reset your CareerDock password",
        html: otpEmailHtml({ heading: "Reset your password", intro: "Use the code below to reset your CareerDock password.", otp }),
    })
}

module.exports = { sendVerificationOTPEmail, sendPasswordResetOTPEmail }
