import express from 'express'
import OpenAI from 'openai'
import {z} from 'zod'
import {zodTextFormat} from 'openai/helpers/zod'

const router = express.Router();

router.post('/', async (req,res) => {
    const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

    const UserInformation = z.object({
        pastRoles: z.array(z.object({
            title: z.string(),
            years: z.number()
        })),
        skills: z.array(z.string()),
        education: z.array(z.string()),
        projects: z.array(z.object({
            name: z.string(),
            details: z.array(z.string())
        })),
        otherExperience: z.array(z.object({
            name: z.string(),
            details: z.array(z.string())
        }))
    });

    const response = await client.responses.parse({
        model: "gpt-4o-2024-08-06",
        input: [
          {
            role: "system",
            content:
              "You are a resume parser. Extract information from the user's resume text and build a structured UserInformation object. Extract: past job roles (each with job title and years spent in that role), technical and soft skills, education history, projects (each with a name and list of details/technologies used), and other relevant experience (each with a name and list of details).",
          },
          { role: "user", content: req.body.resumeText },
        ],
        text: {
          format: zodTextFormat(UserInformation, "user_info"),
        },
    });
    return res.status(200).json({userInfo: response.output_parsed})
})

export default router