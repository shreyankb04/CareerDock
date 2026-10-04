const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginLimiter, signupLimiter, otpLimiter, otpVerifyLimiter } = require('../middlewares/rateLimiter.middleware');

/** These comments are JSDoc comments used to describe functions/controllers/apis etc so you can give very good descriptions and looks good, like documentation looks good
 * @route POST /api/auth/register
 * @description Register a new user (creates an unverified account and emails a 6-digit OTP)
 * @access Public
*/

authRouter.post('/register', signupLimiter, authController.registerUserController)

/**
 * @route POST /api/auth/verify-email
 * @description Verify a signup OTP and activate the account (logs the user in on success)
 * @access Public
 */
authRouter.post('/verify-email', otpVerifyLimiter, authController.verifyEmailController)

/**
 * @route POST /api/auth/resend-otp
 * @description Resend the signup verification OTP (60s cooldown)
 * @access Public
 */
authRouter.post('/resend-otp', otpLimiter, authController.resendVerificationOtpController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @acess Public
 */
authRouter.post("/login", loginLimiter, authController.loginUserController)

/**
 * @route GET /api/auth/logout
 * @description clear token from user cookie and add token in blacklist
 * @access Public
 */
authRouter.get("/logout", authController.logoutUserController)



/**
 * @route GET /api/auth/get-me
 * @description get user details from token
 * @access Private
 */

authRouter.get("/get-me", authMiddleware.authUserMiddleware, authController.getMeController)

/**
 * @route POST /api/auth/forgot-password/request-otp
 * @description Send (or resend) a password-reset OTP to a registered email. Also
 * serves as the "resend" for this flow - cooldown-protected.
 * @access Public
 */
authRouter.post('/forgot-password/request-otp', otpLimiter, authController.forgotPasswordRequestOtpController)

/**
 * @route POST /api/auth/forgot-password/verify-otp
 * @description Verify a password-reset OTP, returns a short-lived reset token
 * @access Public
 */
authRouter.post('/forgot-password/verify-otp', otpVerifyLimiter, authController.forgotPasswordVerifyOtpController)

/**
 * @route POST /api/auth/forgot-password/reset
 * @description Set a new password using the reset token from verify-otp
 * @access Public
 */
authRouter.post('/forgot-password/reset', authController.resetPasswordController)

module.exports = authRouter
