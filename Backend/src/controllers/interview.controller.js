const { PDFParse } = require("pdf-parse")
const generateInterviewReport = require("../services/ai.service")
const generateResumeContent = require("../services/resume.service")
const { buildResumePdfBuffer } = require("../services/pdf.service")
const interviewReportModel = require("../models/interviewReport.model")
const userModel = require("../models/user.model")

/**
 * @name generateInterviewReportController
 * @description Parses the uploaded resume PDF (if provided), sends the resume text +
 * job description + self description to Gemini, saves the generated report in MongoDB
 * and returns it to the client.
 * @access Private
 */
async function generateInterviewReportController(req, res) {

    const { selfDescription, jobDescription } = req.body

    if (!jobDescription || !jobDescription.trim()) {
        return res.status(400).json({
            message: "Job description is required"
        })
    }

    if (!req.file && (!selfDescription || !selfDescription.trim())) {
        return res.status(400).json({
            message: "Please provide a resume or a self description"
        })
    }

    // resumeContent holds the raw text extracted from the uploaded PDF resume.
    // It stays an empty string when no resume was uploaded (selfDescription-only flow).
    let resumeContent = ""

    if (req.file) {
        let parser

        try {
            parser = new PDFParse({ data: req.file.buffer })
            const parsed = await parser.getText()
            resumeContent = parsed?.text?.trim() || ""
        } catch (error) {
            console.log("Resume parsing failed:", error)
            return res.status(422).json({
                message: "Resume parsing failed. Please upload a valid PDF file."
            })
        } finally {
            if (parser) {
                await parser.destroy()
            }
        }

        // Stop here (do NOT call Gemini / MongoDB) if the PDF produced no usable text,
        // e.g. a scanned/image-only PDF.
        if (!resumeContent) {
            return res.status(422).json({
                message: "Could not extract any text from the uploaded resume. Please upload a text-based PDF."
            })
        }
    }

    try {
        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeContent,
            selfDescription,
            jobDescription,
            ...interviewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully",
            interviewReport
        })
    } catch (error) {
        console.log("Interview report generation failed:", error)
        res.status(502).json({
            message: "Failed to generate the interview report. Please try again."
        })
    }

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
        console.log("Resume PDF generation failed:", error)
        res.status(502).json({
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