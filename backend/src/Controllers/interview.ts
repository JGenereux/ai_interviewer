import express from 'express'
const router = express.Router();

import OpenAI from 'openai'
import {z} from 'zod'
import {zodTextFormat} from 'openai/helpers/zod'

const InterviewFeedback = z.object({
    // Overall Assessment
    overallScore: z.number().min(1).max(10),
    overallSummary: z.string(),
    hireRecommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
    
    // Technical Portion
    technical: z.object({
        score: z.number().min(1).max(10),
        problemSolvingApproach: z.object({
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            strengths: z.array(z.string()),
            weaknesses: z.array(z.string())
        }),
        codeQuality: z.object({
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            readability: z.string(),
            efficiency: z.string(),
            edgeCaseHandling: z.string()
        }),
        complexity: z.object({
            understoodComplexity: z.boolean(),
            timeComplexity: z.string(), // what they achieved
            spaceComplexity: z.string(),
            optimalSolution: z.boolean(),
            feedback: z.string()
        }),
        communication: z.object({
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            explainedApproach: z.boolean(),
            askedClarifyingQuestions: z.boolean(),
            thoughtProcess: z.string()
        }),
        debugging: z.object({
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            identifiedIssues: z.boolean(),
            numberOfAttempts: z.number(),
            persistedThroughFailures: z.boolean()
        }),
        highlights: z.array(z.string()),
        areasForImprovement: z.array(z.string())
    }),
    
    // Behavioral Portion
    behavioral: z.object({
        score: z.number().min(1).max(10),
        responses: z.array(z.object({
            question: z.string(),
            competency: z.string(), // e.g., "leadership", "conflict resolution", "teamwork"
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            usedSTARMethod: z.boolean(),
            specificityLevel: z.enum(['vague', 'moderate', 'specific', 'very_specific']),
            strengths: z.array(z.string()),
            weaknesses: z.array(z.string())
        })),
        overallCommunication: z.object({
            clarity: z.number().min(1).max(5),
            conciseness: z.number().min(1).max(5),
            professionalism: z.number().min(1).max(5),
            feedback: z.string()
        }),
        culturalFit: z.object({
            rating: z.number().min(1).max(5),
            feedback: z.string(),
            alignment: z.array(z.string()),
            concerns: z.array(z.string())
        }),
        highlights: z.array(z.string()),
        areasForImprovement: z.array(z.string())
    }),
    
    // Key Strengths & Weaknesses (Overall)
    keyStrengths: z.array(z.string()),
    keyWeaknesses: z.array(z.string()),
    
    // Development Recommendations
    recommendations: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })),
    
    // Next Steps
    readyForRole: z.boolean(),
    suggestedNextSteps: z.string(),
    additionalComments: z.string()
});

type InterviewFeedback = z.infer<typeof InterviewFeedback>;

router.post('/feedback', async (req, res) => {
    try {
        const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

        const {messages, finalCode, submissions, question} = req.body;

        // Build context for the AI
        const conversationHistory = messages.map((msg: any) => 
            `${msg.role}: ${msg.content}`
        ).join('\n\n');

        const submissionsHistory = submissions.submissions.map((sub: any, idx: number) => 
            `Attempt ${idx + 1}:\nCode:\n${sub.code}\nStdout: ${sub.stdout}\nStderr: ${sub.stderr}\nStatus: ${sub.status}`
        ).join('\n\n---\n\n');

        const contextPrompt = `
# Interview Analysis Context

## Problem Given:
${question}

## Conversation History:
${conversationHistory}

## Code Submissions:
${submissionsHistory}

## Final Code:
${finalCode}

---

Analyze this complete interview session and provide comprehensive feedback covering both the technical and behavioral portions.
        `.trim();

        const response = await client.responses.parse({
            model: "gpt-4o-2024-08-06",
            input: [
                {
                    role: "system",
                    content: `You are an expert technical interviewer providing comprehensive feedback on a coding interview. 
                    
Analyze the entire conversation to evaluate:
- Technical problem-solving approach and thought process
- Code quality, correctness, and optimization
- Understanding of time/space complexity
- Communication and explanation skills during technical discussion
- Debugging ability based on submission attempts
- Behavioral responses (if any behavioral questions were asked)
- Professional communication throughout

Provide detailed, constructive feedback with specific examples from the conversation and code submissions.`,
                },
                { role: "user", content: contextPrompt },
            ],
            text: {
                format: zodTextFormat(InterviewFeedback, "interview_feedback"),
            },
        });

        return res.status(200).json({
            success: true,
            feedback: response.output_parsed
        });

    } catch (error) {
        console.error('Error generating feedback:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate interview feedback'
        });
    }
});

export default router