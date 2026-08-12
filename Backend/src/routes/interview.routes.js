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

/**
 * @route GET api/interview
 * @desc Get all interview reports belonging to the logged in user
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUserMiddleware, interviewController.getAllInterviewReportsController)

/**
 * @route GET api/interview/report/:interviewId
 * @desc Get a single interview report by id
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUserMiddleware, interviewController.getInterviewReportByIdController)

/**
 * @route POST api/interview/resume/pdf/:interviewReportId
 * @desc Generate and download a tailored resume PDF for an existing interview report
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUserMiddleware, interviewController.getResumePdfController)

module.exports = interviewRouter