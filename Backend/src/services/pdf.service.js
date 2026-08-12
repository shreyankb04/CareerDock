const PDFDocument = require("pdfkit");

const COLORS = {
    heading: "#111827",
    subheading: "#4b5563",
    muted: "#6b7280",
    rule: "#d1d5db",
    text: "#1f2937",
}

/**
 * @description Renders structured resume content (see resume.service.js schema) into a
 * single-page-friendly, professional PDF and resolves with the resulting Buffer.
 */
function buildResumePdfBuffer(resumeContent) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: "A4", margin: 50 })
            const chunks = []

            doc.on("data", (chunk) => chunks.push(chunk))
            doc.on("end", () => resolve(Buffer.concat(chunks)))
            doc.on("error", reject)

            const {
                fullName,
                headline,
                contactEmail,
                professionalSummary,
                coreSkills,
                experience,
                education,
                projects,
            } = resumeContent

            const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right

            const sectionTitle = (title) => {
                doc.moveDown(0.8)
                doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.heading).text(title.toUpperCase())
                const lineY = doc.y + 2
                doc.moveTo(doc.page.margins.left, lineY)
                    .lineTo(doc.page.margins.left + pageWidth, lineY)
                    .strokeColor(COLORS.rule)
                    .lineWidth(0.75)
                    .stroke()
                doc.moveDown(0.6)
            }

            // Header
            doc.font("Helvetica-Bold").fontSize(22).fillColor(COLORS.heading).text(fullName || "Resume")

            if (headline) {
                doc.moveDown(0.15)
                doc.font("Helvetica").fontSize(12).fillColor(COLORS.subheading).text(headline)
            }

            if (contactEmail) {
                doc.moveDown(0.1)
                doc.font("Helvetica").fontSize(10).fillColor(COLORS.muted).text(contactEmail)
            }

            if (professionalSummary) {
                sectionTitle("Professional Summary")
                doc.font("Helvetica").fontSize(10.5).fillColor(COLORS.text).text(professionalSummary, {
                    align: "left",
                    lineGap: 2,
                })
            }

            if (coreSkills && coreSkills.length > 0) {
                sectionTitle("Core Skills")
                doc.font("Helvetica").fontSize(10.5).fillColor(COLORS.text).text(coreSkills.join("   \u2022   "), {
                    lineGap: 2,
                })
            }

            if (experience && experience.length > 0) {
                sectionTitle("Experience")
                experience.forEach((exp, index) => {
                    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.heading)
                        .text(`${exp.title}${exp.organization ? ` \u2014 ${exp.organization}` : ""}`)

                    if (exp.duration) {
                        doc.font("Helvetica-Oblique").fontSize(9.5).fillColor(COLORS.muted).text(exp.duration)
                    }

                    if (exp.highlights && exp.highlights.length > 0) {
                        doc.moveDown(0.2)
                        doc.font("Helvetica").fontSize(10.5).fillColor(COLORS.text)
                        exp.highlights.forEach((point) => {
                            doc.text(`\u2022 ${point}`, { indent: 8, lineGap: 1 })
                        })
                    }

                    if (index < experience.length - 1) {
                        doc.moveDown(0.5)
                    }
                })
            }

            if (education && education.length > 0) {
                sectionTitle("Education")
                education.forEach((edu, index) => {
                    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.heading)
                        .text(`${edu.degree}${edu.institution ? ` \u2014 ${edu.institution}` : ""}`)

                    if (edu.year) {
                        doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.muted).text(edu.year)
                    }

                    if (index < education.length - 1) {
                        doc.moveDown(0.4)
                    }
                })
            }

            if (projects && projects.length > 0) {
                sectionTitle("Projects")
                projects.forEach((proj, index) => {
                    doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.heading).text(proj.name)
                    doc.font("Helvetica").fontSize(10.5).fillColor(COLORS.text).text(proj.description, { lineGap: 1 })

                    if (index < projects.length - 1) {
                        doc.moveDown(0.4)
                    }
                })
            }

            doc.end()
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = { buildResumePdfBuffer }