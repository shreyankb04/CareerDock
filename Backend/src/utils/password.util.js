// Deliberately not overly strict: minimum 8 characters, at least one letter and
// one number. Special characters are welcomed but never required. This regex
// is mirrored in Frontend/src/features/auth/utils/passwordStrength.js for the
// live typing feedback - keep both in sync if you change the rule.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const WEAK_PASSWORD_MESSAGE = "Password is too weak. Use at least 8 characters with letters and numbers."

/**
 * @description Validates password strength server-side. Never trust the frontend
 * check alone - this runs again on every register/reset-password request.
 */
function isPasswordStrong(password) {
    if (typeof password !== "string") return false
    return PASSWORD_REGEX.test(password)
}

module.exports = {
    isPasswordStrong,
    WEAK_PASSWORD_MESSAGE,
}
