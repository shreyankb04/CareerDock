const { PDFParse } = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const generateResumeContent = require("../services/resume.service")
const { buildResumePdfBuffer } = require("../services/pdf.service")
const interviewReportModel = require("../models/interviewReport.model")
const userModel = require("../models/user.model")

const MAX_JOB_DESCRIPTION_CHARS = 5000 // matches the frontend textarea
const MAX_SELF_DESCRIPTION_CHARS = 5000
const MAX_RESUME_TEXT_CHARS = 15000

// Multipart text fields normally arrive as strings, but a client can send anything.
function asString(value) {
    return typeof value === "string" ? value : ""
}

/**
 * @name generateInterviewReportController
 * @description Parses the uploaded resume PDF (if any), generates the report with
 * Gemini (OpenRouter fallback), saves it and returns it. AI failures surface as a
 * controlled 503 via the central error handler; no provider details reach the client.
 * @access Private
 */
async function generateInterviewReportController(req, res) {

    const jobDescription = asString(req.body?.jobDescription).trim()
    const selfDescription = asString(req.body?.selfDescription).trim()

    if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" })
    }
    if (jobDescription.length > MAX_JOB_DESCRIPTION_CHARS) {
        return res.status(400).json({ message: `Job description is too long. Please keep it under ${MAX_JOB_DESCRIPTION_CHARS} characters.` })
    }
    if (selfDescription.length > MAX_SELF_DESCRIPTION_CHARS) {
        return res.status(400).json({ message: `Self description is too long. Please keep it under ${MAX_SELF_DESCRIPTION_CHARS} characters.` })
    }
    if (!req.file && !selfDescription) {
        return res.status(400).json({ message: "Please provide a resume or a self description" })
    }

    // Raw text extracted from the uploaded PDF; stays "" in the selfDescription-only flow.
    let resumeContent = ""

    if (req.file) {
        // MIME type / extension come from the client, so also check the bytes look like a PDF.
        if (!req.file.buffer.subarray(0, 1024).includes("%PDF-")) {
            return res.status(422).json({ message: "Resume parsing failed. Please upload a valid PDF file." })
        }

        let parser
        try {
            parser = new PDFParse({ data: req.file.buffer })
            const parsed = await parser.getText()
            resumeContent = (parsed?.text?.trim() || "").slice(0, MAX_RESUME_TEXT_CHARS)
        } catch (error) {
            console.error("Resume parsing failed:", error?.message)
            return res.status(422).json({ message: "Resume parsing failed. Please upload a valid PDF file." })
        } finally {
            if (parser) {
                await parser.destroy()
            }
        }

        // Do NOT call the AI / MongoDB for a PDF with no text (e.g. a scan).
        if (!resumeContent) {
            return res.status(422).json({ message: "Could not extract any text from the uploaded resume. Please upload a text-based PDF." })
        }
    }

    // Throws a controlled 503 if the AI providers are unavailable (handled by errorHandler).
    const interviewReportByAi = await generateInterviewReport({
        resume: resumeContent,
        selfDescription,
        jobDescription
    })

    // Fields listed explicitly (not spread) so AI output can never override `user`.
    const interviewReport = await interviewReportModel.create({
        user: req.user.id,
        resume: resumeContent,
        selfDescription,
        jobDescription,
        matchScore: interviewReportByAi.matchScore,
        technicalQuestions: interviewReportByAi.technicalQuestions,
        behavioralQuestions: interviewReportByAi.behavioralQuestions,
        skillGaps: interviewReportByAi.skillGaps,
        preparationPlan: interviewReportByAi.preparationPlan
    })

    res.status(201).json({
        message: "Interview report generated successfully",
        interviewReport
    })
}

/**
 * @name getAllInterviewReportsController
 * @description Get all interview reports belonging to the logged in user, most recent first.
 * @access Private
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })

        res.status(200).json({
            message: "Interview reports fetched successfully",
            interviewReports
        })
    } catch (error) {
        console.log("Fetching interview reports failed:", error)
        res.status(500).json({
            message: "Failed to fetch interview reports."
        })
    }
}

/**
 * @name getInterviewReportByIdController
 * @description Get a single interview report by id, scoped to the logged in user.
 * @access Private
 */
async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params

    try {
        const interviewReport = await interviewReportModel.findOne({
            _id: interviewId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully",
            interviewReport
        })
    } catch (error) {
        console.log("Fetching interview report failed:", error)
        res.status(400).json({
            message: "Invalid interview report id."
        })
    }
}

/**
 * @name getResumePdfController
 * @description Generates a professional, tailored resume PDF for the logged in user from an
 * existing interview report (job description + resume text + self description + skill gaps)
 * and streams it back as a downloadable PDF.
 * @access Private
 */
async function getResumePdfController(req, res) {
    const { interviewReportId } = req.params

    let interviewReport
    let user

    try {
        interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found"
            })
        }

        user = await userModel.findById(req.user.id)

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }
    } catch (error) {
        console.log("Fetching data for resume PDF failed:", error)
        return res.status(400).json({
            message: "Invalid interview report id."
        })
    }

    try {
        const resumeContent = await generateResumeContent({
            username: user.username,
            email: user.email,
            jobDescription: interviewReport.jobDescription,
            selfDescription: interviewReport.selfDescription,
            resumeText: interviewReport.resume,
            skillGaps: interviewReport.skillGaps
        })

        const pdfBuffer = await buildResumePdfBuffer(resumeContent)

        const safeFileName = (resumeContent.fullName || user.username || "resume")
            .trim()
            .replace(/[^a-z0-9]+/gi, "_")
            .toLowerCase() || "resume"

        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition", `attachment; filename="${safeFileName}_resume.pdf"`)
        res.status(200).send(pdfBuffer)
    } catch (error) {
        console.error("Resume PDF generation failed:", error?.message)

        // Controlled "AI temporarily unavailable" error from the AI provider layer.
        if (error.statusCode === 503) {
            return res.status(503).json({ message: error.message })
        }

        res.status(500).json({
            message: "Failed to generate the resume PDF. Please try again."
        })
    }
}


module.exports = {
    generateInterviewReportController,
    getAllInterviewReportsController,
    getInterviewReportByIdController,
    getResumePdfController
}
