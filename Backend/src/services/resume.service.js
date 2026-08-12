const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

// Structured, resume-appropriate content. Kept deliberately close to what CareerDock
// already has available (resume text, self description, job description, skill gaps)
// instead of inventing new fields the app has no data for.
const resumeContentSchema = z.object({
    fullName: z.string().describe("The candidate's full name. Use the name found in the resume text if present, otherwise fall back to the provided username."),
    headline: z.string().describe("A short professional headline/title tailored to the target job, e.g. 'Senior Frontend Engineer'."),
    contactEmail: z.string().describe("The candidate's email address, exactly as provided. Do not invent one."),
    professionalSummary: z.string().describe("A concise 3-4 sentence professional summary tailored to the target job description, grounded only in the information provided. Do not overstate the candidate's experience level."),
    coreSkills: z.array(z.string()).describe("A prioritized list of the candidate's most relevant skills for this job, drawn only from the resume text and/or self description provided."),
    experience: z.array(z.object({
        title: z.string().describe("Job title, exactly as stated in the source resume text."),
        organization: z.string().describe("Employer/organization name, exactly as stated in the source resume text."),
        duration: z.string().describe("Employment period, e.g. '2021 - 2023' or 'Jan 2020 - Present', exactly as stated in the source resume text."),
        highlights: z.array(z.string()).describe("2-4 concise bullet points describing achievements/responsibilities for this role, based only on the source resume text. You may rephrase for clarity and impact but must not invent facts."),
    })).describe("Work experience entries extracted ONLY from the resume text provided. Return an empty array if no resume text was provided or it contains no identifiable work history. Do NOT invent employers, titles, or dates."),
    education: z.array(z.object({
        degree: z.string().describe("Degree/qualification, exactly as stated in the source resume text."),
        institution: z.string().describe("Institution name, exactly as stated in the source resume text."),
        year: z.string().optional().describe("Graduation year or date range, if stated."),
    })).describe("Education entries extracted ONLY from the resume text provided. Return an empty array if none was provided. Do NOT invent degrees or institutions."),
    projects: z.array(z.object({
        name: z.string().describe("Project name, as stated in the resume text or self description."),
        description: z.string().describe("A 1-2 sentence description of the project, based only on the provided information."),
    })).describe("Notable projects mentioned in the resume text or self description, if any. Return an empty array if none are mentioned."),
});

/**
 * @description Generates structured, professional resume content tailored to a target job,
 * using only the candidate's own data already stored in CareerDock (resume text extracted
 * from their uploaded PDF, self description, job description, and identified skill gaps).
 */
async function generateResumeContent({ username, email, jobDescription, selfDescription, resumeText, skillGaps }) {

    const skillGapsList = (skillGaps || [])
        .map((gap) => `${gap.skill} (${gap.severity} severity)`)
        .join(", ") || "None identified"

    const prompt = `You are an expert resume writer. Using ONLY the information provided below, produce a polished,
                    professional, ATS-friendly resume tailored to the target job description.

                    STRICT RULES:
                    - Do NOT invent employers, job titles, dates, companies, degrees, institutions, or achievements
                      that are not present in the provided resume text or self description.
                    - If the resume text does not contain a clear work history, return an empty "experience" array
                      rather than fabricating one.
                    - If the resume text does not contain education details, return an empty "education" array
                      rather than fabricating one.
                    - You MAY rephrase, reorganize, and emphasize existing information to better match the job
                      description.
                    - You MAY prioritize and reorder skills based on relevance to the job description and the
                      candidate's identified skill gaps (list the gaps as areas to note internally, do not present
                      them as strengths).
                    - Keep the professionalSummary honest and grounded in the information provided.
                    - Return ALL fields required by the provided JSON schema.

                    Candidate name (fallback if resume text has no name): ${username}
                    Candidate email: ${email}

                    Target Job Description:
                    ${jobDescription}

                    Candidate's Self Description:
                    ${selfDescription || "Not provided"}

                    Candidate's Resume Text (raw, extracted from their uploaded PDF):
                    ${resumeText || "Not provided"}

                    Candidate's Known Skill Gaps (context only, for prioritization - do not list as strengths):
                    ${skillGapsList}
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumeContentSchema),
        }
    })

    return JSON.parse(response.text)
}

module.exports = generateResumeContent