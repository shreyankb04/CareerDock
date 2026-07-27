const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const interviewController = require('../controllers/interview.controller')
const upload = require('../middlewares/file.middleware')

const interviewRouter = express.Router()


/**
 * @route POST api/interview
 * @desc Generate new interview report on the basis of user self description, resume pdf and job description
 * @access private
 *
 */
interviewRouter.post("/", authMiddleware.authUserMiddleware, upload.single("resume"), interviewController.generateInterviewReportController)

module.exports = interviewRouter