const { GoogleGenAI } = require("@google/genai");
const {z} = require("zod");
const {zodToJsonSchema} = require("zod-to-json-schema")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
})

const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100).describe("The match score of the candidate between 0 to 100 indicating how well the canditate's profile matches the job description"), 
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The Technical Question can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking thisquestion"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.") 
    })).describe("Technical Questions that can be asked in the interview along with their intentions and how to answer them"),

    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The Behavioral Question can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking thisquestion"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.") 
    })).describe("Behavioral Questions that can be asked in the interview along with their intentions and how to answer them"),

    skillGaps: z.array(z.object({
        skill: z.string().describe("The Skill which the canditate is lacking"),
        severity: z.enum(["low", "medium", "high"]),
    })).describe("List of skill gaps in the candidate's profile along with their severity"),

    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, example like data structures, system design, mock interviews, core cs concepts, etc etc"),
        tasks: z.array(z.string()).describe("List of tasks that the candidate needs to do in this day to follow the preparation plan"),
    })).describe("A day wise Preparation plan for the candidate to follow along with their interview preparation"),

})

async function generateInterviewReport({resume, selfDescription, jobDescription}){

    const prompt = `You are an expert interviewer so analyze the following canditate, 
                    - Calculate a matchScore between 0 and 100.
                    - Generate at least 10 technicalQuestions.
                    - Generate at least 5 behavioralQuestions.
                    - Generate all skillGaps.
                    - Generate a preparationPlan for the candidate according to the information provided.
                    - Return ALL fields required by the provided JSON schema.
                    - Do not leave any array empty.
                    Generate an interview report for a canditate with the following details:
        Resume: ${resume}
        Self Description: ${selfDescription}
        Job Description: ${jobDescription}
        `

const schema = zodToJsonSchema(interviewReportSchema);

console.log(JSON.stringify(schema, null, 2));



const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: prompt,
    config:{
        responseMimeType:"application/json",
        responseSchema: zodToJsonSchema(interviewReportSchema),
    }
})
console.log(response.text)
return JSON.parse(response.text)

}

module.exports = generateInterviewReport