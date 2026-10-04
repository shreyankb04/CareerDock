const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        unique:[true, "username already taken" ],
        required: true,
    },

    email:{
        type:String,
        unique:[true, "Account already exists with this email address"],
        required: true,
    },

    password: {
        type: String,
        required: true,
    },

    // ── Email verification ───────────────────────────────────────────────
    isVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationOTP: {
        type: String,
        select: false, // hashed OTP, never returned by default queries
    },
    emailVerificationOTPExpiry: {
        type: Date,
        select: false,
    },
    emailVerificationOTPLastSentAt: {
        type: Date,
        select: false, // used to enforce the resend cooldown
    },

    // ── Forgot / reset password ──────────────────────────────────────────
    resetPasswordOTP: {
        type: String,
        select: false, // hashed OTP, never returned by default queries
    },
    resetPasswordOTPExpiry: {
        type: Date,
        select: false,
    },
    resetPasswordOTPLastSentAt: {
        type: Date,
        select: false,
    },
})

const userModel = mongoose.model("users", userSchema)

module.exports = userModel
