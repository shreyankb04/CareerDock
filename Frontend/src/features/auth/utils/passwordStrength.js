// Mirrors Backend/src/utils/password.util.js - keep both in sync if the rule changes.
// Deliberately not overly strict: 8+ chars, at least one letter and one number.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/

const WEAK_MESSAGE = "Password is too weak. Use at least 8 characters with letters and numbers."

/**
 * @description Live typing feedback for password fields. Returns null while the
 * field is empty (so we don't show an error before the user has typed anything).
 */
export function checkPasswordStrength(password) {
    if (!password) {
        return { isValid: false, message: null }
    }

    if (!PASSWORD_REGEX.test(password)) {
        return { isValid: false, message: WEAK_MESSAGE }
    }

    const hasSpecialChar = /[^A-Za-z0-9]/.test(password)

    return {
        isValid: true,
        message: hasSpecialChar ? "Strong password." : "Good password.",
    }
}
