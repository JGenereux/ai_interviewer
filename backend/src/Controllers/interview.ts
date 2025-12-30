import express from 'express'
const router = express.Router();

import OpenAI from 'openai'
import InterviewFeedback from '../Types/interviewFeedback';
import {zodTextFormat} from 'openai/helpers/zod'

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