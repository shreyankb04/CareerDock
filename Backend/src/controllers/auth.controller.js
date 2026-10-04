const userModel = require('../models/user.model');
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require('../models/blacklist.model');
const { generateOTP, hashOTP, compareOTP, getOTPExpiry, checkResendCooldown } = require("../utils/otp.util")
const { isPasswordStrong, WEAK_PASSWORD_MESSAGE } = require("../utils/password.util")
const { sendVerificationOTPEmail, sendPasswordResetOTPEmail } = require("../services/email.service")

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

const MAX_USERNAME_LENGTH = 50
const MAX_EMAIL_LENGTH = 254
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Request bodies are user-controlled: a field can arrive as a number, array or object.
// Anything that isn't a string is treated as missing.
function asTrimmedString(value) {
    return typeof value === "string" ? value.trim() : ""
}

// Emails are matched case-insensitively, so they are always stored/looked up lowercased.
function normalizeEmail(value) {
    return asTrimmedString(value).toLowerCase()
}

/**
 * @description Sets the auth cookie. In production the frontend and backend live on
 * different hosts, so the cookie uses sameSite:"none" + secure:true; locally "lax"
 * is sufficient and avoids needing HTTPS in dev.
 */
function setAuthCookie(res, token) {
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches JWT_EXPIRES_IN default
    })
}

function clearAuthCookie(res) {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
}

/**
 * @name registerUserController
 * @description Creates an unverified account and emails a 6-digit OTP. The
 * account cannot log in until it's verified via verifyEmailController.
 * @access Public
 */
async function registerUserController(req, res, next) {
    try {
        const username = asTrimmedString(req.body.username)
        const email = normalizeEmail(req.body.email)
        const password = typeof req.body.password === "string" ? req.body.password : ""

        if (!username || !email || !password) {
            return res.status(400).json({
                message: "Please provide username, email and password"
            })
        }

        if (username.length > MAX_USERNAME_LENGTH) {
            return res.status(400).json({ message: `Username must be at most ${MAX_USERNAME_LENGTH} characters.` })
        }

        if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
            return res.status(400).json({ message: "Please enter a valid email address." })
        }

        if (!isPasswordStrong(password)) {
            return res.status(400).json({ message: WEAK_PASSWORD_MESSAGE })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)
        const otp = generateOTP()

        const user = await userModel.create({
            username,
            email,
            password: hash,
            isVerified: false,
            emailVerificationOTP: await hashOTP(otp),
            emailVerificationOTPExpiry: getOTPExpiry(),
            emailVerificationOTPLastSentAt: new Date(),
        })

        try {
            await sendVerificationOTPEmail({ to: user.email, otp })
        } catch (emailError) {
            // The code never reached the user: don't leave a half-created account that
            // would block them from simply signing up again.
            await userModel.deleteOne({ _id: user._id })
            throw emailError
        }

        // Deliberately no cookie/session here - the account isn't usable until verified.
        res.status(201).json({
            message: "Account created. We've sent a 6-digit verification code to your email.",
            email: user.email
        })
    } catch (err) {
        next(err)
    }
}

/**
 * @name verifyEmailController
 * @description Verifies a signup OTP and marks the account verified. Logs the
 * user in immediately on success (same cookie flow as login), since that's the
 * closest match to the original "register -> straight into the app" feel.
 * @access Public
 */
async function verifyEmailController(req, res, next) {
    try {
        const email = normalizeEmail(req.body.email)
        const otp = asTrimmedString(req.body.otp)

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" })
        }

        const user = await userModel.findOne({ email })
            .select("+emailVerificationOTP +emailVerificationOTPExpiry")

        if (!user) {
            return res.status(404).json({ message: "Account not found." })
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This account is already verified. Please log in." })
        }

        if (!user.emailVerificationOTP || !user.emailVerificationOTPExpiry) {
            return res.status(400).json({ message: "No active code found. Please request a new one." })
        }

        if (user.emailVerificationOTPExpiry.getTime() < Date.now()) {
            return res.status(400).json({ message: "This code has expired. Please request a new one." })
        }

        const isValid = await compareOTP(otp, user.emailVerificationOTP)
        if (!isValid) {
            return res.status(400).json({ message: "Incorrect code. Please try again." })
        }

        user.isVerified = true
        user.emailVerificationOTP = undefined
        user.emailVerificationOTPExpiry = undefined
        user.emailVerificationOTPLastSentAt = undefined
        await user.save()

        const token = signToken({ id: user._id, username: user.username })
        setAuthCookie(res, token)

        res.status(200).json({
            message: "Email verified successfully.",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        next(err)
    }
}

/**
 * @name resendVerificationOtpController
 * @description Regenerates and resends the signup OTP, subject to a 60s cooldown.
 * @access Public
 */
async function resendVerificationOtpController(req, res, next) {
    try {
        const email = normalizeEmail(req.body.email)

        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }

        const user = await userModel.findOne({ email }).select("+emailVerificationOTPLastSentAt")

        if (!user) {
            return res.status(404).json({ message: "Account not found." })
        }

        if (user.isVerified) {
            return res.status(400).json({ message: "This account is already verified. Please log in." })
        }

        const { allowed, retryAfterSeconds } = checkResendCooldown(user.emailVerificationOTPLastSentAt)
        if (!allowed) {
            return res.status(429).json({
                message: `Please wait ${retryAfterSeconds}s before requesting another code.`,
                retryAfterSeconds
            })
        }

        const otp = generateOTP()
        user.emailVerificationOTP = await hashOTP(otp)
        user.emailVerificationOTPExpiry = getOTPExpiry()
        user.emailVerificationOTPLastSentAt = new Date()
        await user.save()

        await sendVerificationOTPEmail({ to: user.email, otp })

        res.status(200).json({ message: "A new verification code has been sent to your email." })
    } catch (err) {
        next(err)
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res, next) {
    try {
        const email = normalizeEmail(req.body.email)
        const password = typeof req.body.password === "string" ? req.body.password : ""

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(400).json({
                message: "Invalid email or password"
            })
        }

        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                needsVerification: true,
                email: user.email
            })
        }

        const token = signToken({ id: user._id, username: user.username })
        setAuthCookie(res, token)

        res.status(200).json({
            message: "User Logged in Successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        })
    } catch (err) {
        next(err)
    }
}


/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in the blacklist
 * @access Public
 */
async function logoutUserController(req, res, next) {
    try {
        const token = req.cookies.token;

        if (token) {
            // Only blacklist a genuine, still-valid token (this route is public, so otherwise
            // anyone could make us store arbitrary strings). Expired/forged tokens can't
            // authenticate anyway.
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                await tokenBlacklistModel.create({ token, expiresAt: new Date(decoded.exp * 1000) })
            } catch (verifyError) {
                if (!["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(verifyError.name)) {
                    throw verifyError
                }
            }
        }
        clearAuthCookie(res)
        res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        next(err)
    }
}

/**
 * @name getMeController
 * @description get user details from token
 * @access Private
 */
async function getMeController(req, res, next) {
    try {
        const user = await userModel.findById(req.user.id).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.status(200).json({
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isVerified: user.isVerified
            }
        })
    } catch (err) {
        next(err)
    }
}

/**
 * @name forgotPasswordRequestOtpController
 * @description Sends a password-reset OTP if the email is registered. Always
 * responds with the same generic message regardless of whether the account
 * exists, so this endpoint can't be used to enumerate registered emails.
 * @access Public
 */
async function forgotPasswordRequestOtpController(req, res, next) {
    try {
        const email = normalizeEmail(req.body.email)

        if (!email) {
            return res.status(400).json({ message: "Email is required" })
        }

        const genericResponse = {
            message: "If an account exists for this email, a password reset code has been sent."
        }

        const user = await userModel.findOne({ email }).select("+resetPasswordOTPLastSentAt")

        if (!user) {
            return res.status(200).json(genericResponse)
        }

        const { allowed, retryAfterSeconds } = checkResendCooldown(user.resetPasswordOTPLastSentAt)
        if (!allowed) {
            // Note: unlike the response above, this does implicitly confirm the
            // account exists (only a real account can hit its own cooldown). This
            // is a deliberate, minor trade-off for usability - see changelog.
            return res.status(429).json({
                message: `Please wait ${retryAfterSeconds}s before requesting another code.`,
                retryAfterSeconds
            })
        }

        const otp = generateOTP()
        user.resetPasswordOTP = await hashOTP(otp)
        user.resetPasswordOTPExpiry = getOTPExpiry()
        user.resetPasswordOTPLastSentAt = new Date()
        await user.save()

        await sendPasswordResetOTPEmail({ to: user.email, otp })

        res.status(200).json(genericResponse)
    } catch (err) {
        next(err)
    }
}

/**
 * @name forgotPasswordVerifyOtpController
 * @description Verifies a password-reset OTP and, on success, issues a
 * short-lived (10 minute) reset token the client must present to actually
 * change the password. The OTP itself is cleared immediately so it can't be
 * replayed once the reset token has been issued.
 * @access Public
 */
async function forgotPasswordVerifyOtpController(req, res, next) {
    try {
        const email = normalizeEmail(req.body.email)
        const otp = asTrimmedString(req.body.otp)

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" })
        }

        const user = await userModel.findOne({ email })
            .select("+resetPasswordOTP +resetPasswordOTPExpiry")

        if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
            return res.status(400).json({ message: "Invalid or expired code. Please request a new one." })
        }

        if (user.resetPasswordOTPExpiry.getTime() < Date.now()) {
            return res.status(400).json({ message: "This code has expired. Please request a new one." })
        }

        const isValid = await compareOTP(otp, user.resetPasswordOTP)
        if (!isValid) {
            return res.status(400).json({ message: "Incorrect code. Please try again." })
        }

        user.resetPasswordOTP = undefined
        user.resetPasswordOTPExpiry = undefined
        await user.save()

        const resetToken = jwt.sign(
            { id: user._id, purpose: "password-reset" },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        )

        res.status(200).json({
            message: "Code verified. You can now set a new password.",
            resetToken
        })
    } catch (err) {
        next(err)
    }
}

/**
 * @name resetPasswordController
 * @description Sets a new password, authorized by the short-lived resetToken
 * issued from forgotPasswordVerifyOtpController.
 * @access Public
 */
async function resetPasswordController(req, res, next) {
    try {
        const resetToken = typeof req.body.resetToken === "string" ? req.body.resetToken : ""
        const newPassword = typeof req.body.newPassword === "string" ? req.body.newPassword : ""

        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: "Reset token and new password are required" })
        }

        if (!isPasswordStrong(newPassword)) {
            return res.status(400).json({ message: WEAK_PASSWORD_MESSAGE })
        }

        let decoded
        try {
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET)
        } catch (err) {
            return res.status(401).json({ message: "This reset link has expired. Please start again." })
        }

        if (decoded.purpose !== "password-reset") {
            return res.status(401).json({ message: "Invalid reset token." })
        }

        const user = await userModel.findById(decoded.id)
        if (!user) {
            return res.status(404).json({ message: "Account not found." })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        await user.save()

        res.status(200).json({ message: "Password reset successfully. Please log in with your new password." })
    } catch (err) {
        next(err)
    }
}

module.exports = {
    registerUserController,
    verifyEmailController,
    resendVerificationOtpController,
    loginUserController,
    logoutUserController,
    getMeController,
    forgotPasswordRequestOtpController,
    forgotPasswordVerifyOtpController,
    resetPasswordController,
}
