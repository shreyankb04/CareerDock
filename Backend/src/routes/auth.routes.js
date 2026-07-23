const express = require('express');
const authRouter = express.Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

/** These comments are JSDoc comments used to describe functions/controllers/apis etc so you can give very good descriptions and looks good, like documentation looks good 
 * @route POST /api/auth/register
 * @description Register a new user
 * @access Public
*/

authRouter.post('/register', authController.registerUserController)

/**
 * @route POST /api/auth/login
 * @description login user with email and password
 * @acess Public
 */
authRouter.post("/login",authController.loginUserController)

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

authRouter.get("/get-me", authMiddleware.authUserMiddleware,authController.getMeController)
module.exports = authRouter