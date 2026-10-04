const crypto = require("crypto")
const bcrypt = require("bcryptjs")

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const OTP_RESEND_COOLDOWN_SECONDS = 60

/**
 * @description Generates a random 6-digit numeric OTP as a string (e.g. "042917").
 * Uses crypto.randomInt so it's not predictable the way Math.random() would be.
 */
function generateOTP() {
    const min = 10 ** (OTP_LENGTH - 1)
    const max = 10 ** OTP_LENGTH - 1
    return String(crypto.randomInt(min, max + 1))
}

/**
 * @description Hashes an OTP the same way we hash passwords, so a database leak
 * doesn't directly expose usable OTPs.
 */
async function hashOTP(otp) {
    return bcrypt.hash(otp, 10)
}

/**
 * @description Compares a plaintext OTP against its hashed, stored counterpart.
 */
async function compareOTP(plainOTP, hashedOTP) {
    if (!plainOTP || !hashedOTP) return false
    return bcrypt.compare(plainOTP, hashedOTP)
}

/**
 * @description Returns a Date OTP_EXPIRY_MINUTES from now.
 */
function getOTPExpiry() {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
}

/**
 * @description Checks whether the resend cooldown has elapsed since lastSentAt.
 * Returns { allowed, retryAfterSeconds }.
 */
function checkResendCooldown(lastSentAt) {
    if (!lastSentAt) return { allowed: true, retryAfterSeconds: 0 }

    const elapsedSeconds = (Date.now() - new Date(lastSentAt).getTime()) / 1000
    const remaining = OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds

    if (remaining <= 0) return { allowed: true, retryAfterSeconds: 0 }
    return { allowed: false, retryAfterSeconds: Math.ceil(remaining) }
}

module.exports = {
    OTP_EXPIRY_MINUTES,
    OTP_RESEND_COOLDOWN_SECONDS,
    generateOTP,
    hashOTP,
    compareOTP,
    getOTPExpiry,
    checkResendCooldown,
}
