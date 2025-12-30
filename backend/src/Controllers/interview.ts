import express from 'express'
const router = express.Router();

import axios from 'axios'
import OpenAI from 'openai'
import { getFeedbackSchema, type InterviewMode } from '../Types/interviewFeedback';
import {zodTextFormat} from 'openai/helpers/zod'
import dbClient from '../db/client'
import type { Interview } from '../Types/interview'
import type { ProblemAttempt } from '../Types/problemAttempt'

function getSystemPrompt(mode: InterviewMode): string {
    switch (mode) {
        case 'behavioral':
            return `You are an expert interviewer providing comprehensive feedback on a behavioral interview session.

Analyze the conversation to evaluate:
- Behavioral responses and examples provided
- Use of STAR method (Situation, Task, Action, Result)
- Communication clarity and professionalism
- Cultural fit indicators
- Leadership and teamwork examples

The overall score should be based ONLY on behavioral performance.
Provide detailed, constructive feedback with specific examples from the conversation.`;

        case 'technical':
            return `You are an expert technical interviewer providing comprehensive feedback on a coding interview.

Analyze the conversation and code to evaluate:
- Technical problem-solving approach and thought process
- Code quality, correctness, and optimization
- Understanding of time/space complexity
- Communication during technical discussion
- Debugging ability based on submission attempts

The overall score should be based ONLY on technical performance.
Provide detailed, constructive feedback with specific examples from the conversation and code submissions.`;

        case 'full':
        default:
            return `You are an expert technical interviewer providing comprehensive feedback on a coding interview. 

Analyze the entire conversation to evaluate:
- Technical problem-solving approach and thought process
- Code quality, correctness, and optimization
- Understanding of time/space complexity
- Communication and explanation skills during technical discussion
- Debugging ability based on submission attempts
- Behavioral responses (if any behavioral questions were asked)
- Professional communication throughout

Provide detailed, constructive feedback with specific examples from the conversation and code submissions.`;
    }
}

function buildContextPrompt(mode: InterviewMode, messages: any[], finalCode: string, submissions: any, question: any): string {
    const conversationHistory = messages.map((msg: any) => 
        `${msg.role}: ${msg.content}`
    ).join('\n\n');

    if (mode === 'behavioral') {
        return `
# Behavioral Interview Analysis

## Conversation History:
${conversationHistory}

---

Analyze this behavioral interview session and provide comprehensive feedback on communication, examples provided, and overall behavioral assessment.
        `.trim();
    }

    const submissionsHistory = submissions?.submissions?.map((sub: any, idx: number) => 
        `Attempt ${idx + 1}:\nCode:\n${sub.code}\nStdout: ${sub.stdout}\nStderr: ${sub.stderr}\nStatus: ${sub.status}`
    ).join('\n\n---\n\n') || 'No code submissions';

    if (mode === 'technical') {
        return `
# Technical Interview Analysis

## Problem Given:
${question || 'Problem information not available'}

## Conversation History:
${conversationHistory}

## Code Submissions:
${submissionsHistory}

## Final Code:
${finalCode || 'No final code submitted'}

---

Analyze this technical interview session and provide comprehensive feedback on problem-solving, code quality, and technical communication.
        `.trim();
    }

    return `
# Interview Analysis Context

## Problem Given:
${question || 'Problem information not available'}

## Conversation History:
${conversationHistory}

## Code Submissions:
${submissionsHistory}

## Final Code:
${finalCode || 'No final code submitted'}

---

Analyze this complete interview session and provide comprehensive feedback covering both the technical and behavioral portions.
    `.trim();
}

const TOKENS_PER_MINUTE = 50;
const MIN_TOKENS_REQUIRED = 750;

router.post('/start', async (req, res) => {
    try {
        const { userId, mode } = req.body;

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'User ID is required' 
            });
        }

        const { data: userData, error: userError } = await dbClient
            .from('users')
            .select('tokens')
            .eq('id', userId)
            .single();

        if (userError || !userData) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        if (userData.tokens < MIN_TOKENS_REQUIRED) {
            return res.status(402).json({ 
                success: false, 
                error: 'Insufficient tokens',
                tokensRequired: MIN_TOKENS_REQUIRED,
                tokensAvailable: userData.tokens
            });
        }

        const interviewId = crypto.randomUUID();
        const startedAt = new Date();

        const { error: insertError } = await dbClient
            .from('interviews')
            .insert({
                id: interviewId,
                user_id: userId,
                created_at: startedAt,
                mode: mode || 'full',
                feedback: null,
                messages: [],
                code: '',
                problem_attempt_ids: []
            });

        if (insertError) {
            console.error('Error creating interview:', insertError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create interview' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            interviewId,
            startedAt: startedAt.toISOString()
        });

    } catch (error) {
        console.error('Error starting interview:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to start interview' 
        });
    }
});

router.post('/feedback', async (req, res) => {
    try {
        const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

        const {messages, finalCode, submissions, question, mode = 'full'} = req.body;
        const interviewMode = mode as InterviewMode;

        const feedbackSchema = getFeedbackSchema(interviewMode);
        const systemPrompt = getSystemPrompt(interviewMode);
        const contextPrompt = buildContextPrompt(interviewMode, messages, finalCode, submissions, question);

        const response = await client.responses.parse({
            model: "gpt-4o-2024-08-06",
            input: [
                { role: "system", content: systemPrompt },
                { role: "user", content: contextPrompt },
            ],
            text: {
                format: zodTextFormat(feedbackSchema, "interview_feedback"),
            },
        });

        const feedback = {
            ...response.output_parsed,
            mode: interviewMode
        };

        return res.status(200).json({
            success: true,
            feedback
        });

    } catch (error) {
        console.error('Error generating feedback:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate interview feedback'
        });
    }
});

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

router.post('/execute', async (req, res) => {
    try {
        const { language, version, testCases } = req.body;

        const results = [];
        for (let i = 0; i < testCases.length; i++) {
            if (i > 0) await delay(250);
            
            try {
                const response = await axios.post('https://emkc.org/api/v2/piston/execute', {
                    language,
                    version,
                    files: [{ content: testCases[i] }]
                });

                const { stdout, stderr } = response.data.run;
                let filteredStderr = stderr;
                if (stderr) {
                    const match = stderr.match(/Error:\s*(Test Case \d+ Failed)/i);
                    if (match) {
                        filteredStderr = match[1];
                    } else if (stderr.includes('Test Case') && stderr.includes('Failed')) {
                        const testMatch = stderr.match(/Test Case #?\d+\s*Failed/i);
                        filteredStderr = testMatch ? testMatch[0] : 'Test Failed';
                    }
                }

                results.push({
                    index: i + 1,
                    stdout,
                    stderr: filteredStderr,
                    passed: !filteredStderr || filteredStderr.trim() === ''
                });
            } catch (error: any) {
                results.push({
                    index: i + 1,
                    stdout: '',
                    stderr: 'Execution failed',
                    passed: false
                });
            }
        }

        return res.status(200).json({
            success: true,
            results
        });
    } catch (error: any) {
        console.error('Code execution error:', error.response?.data || error.message || error);
        return res.status(500).json({
            success: false,
            error: 'Failed to execute code',
            details: error.response?.data || error.message
        });
    }
});

router.post('/save', async (req, res) => {
    try {
        const { interview, problemAttempts } = req.body as { 
            interview: Interview, 
            problemAttempts: ProblemAttempt[] 
        };

        if (!interview || !interview.id || !interview.userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid interview data' 
            });
        }

        const { data: existingInterview, error: fetchError } = await dbClient
            .from('interviews')
            .select('created_at, tokens_deducted')
            .eq('id', interview.id)
            .single();

        if (fetchError || !existingInterview) {
            console.error('Error fetching interview:', fetchError);
            return res.status(404).json({ 
                success: false, 
                error: 'Interview not found' 
            });
        }

        let tokensUsed = 0;
        if (!existingInterview.tokens_deducted && existingInterview.created_at) {
            const startedAt = new Date(existingInterview.created_at);
            const endedAt = new Date();
            const elapsedMinutes = (endedAt.getTime() - startedAt.getTime()) / (1000 * 60);
            tokensUsed = Math.ceil(elapsedMinutes * TOKENS_PER_MINUTE);

            const { data: userData, error: userFetchError } = await dbClient
                .from('users')
                .select('tokens')
                .eq('id', interview.userId)
                .single();

            if (userFetchError || !userData) {
                console.error('Error fetching user:', userFetchError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to fetch user data' 
                });
            }

            const newTokenBalance = Math.max(0, userData.tokens - tokensUsed);
            const { error: tokenUpdateError } = await dbClient
                .from('users')
                .update({ tokens: newTokenBalance })
                .eq('id', interview.userId);

            if (tokenUpdateError) {
                console.error('Error updating tokens:', tokenUpdateError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to deduct tokens' 
                });
            }
        }

        for (const attempt of problemAttempts) {
            const { error: attemptError } = await dbClient
                .from('problem_attempts')
                .upsert({
                    interview_id: attempt.interviewId,
                    started_at: attempt.startedAt,
                    language: attempt.language,
                    version: attempt.version,
                    feedback: attempt.feedback,
                    submissions: attempt.submissions
                });

            if (attemptError) {
                console.error('Error saving problem attempt:', attemptError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to save problem attempt' 
                });
            }
        }

        const { error: interviewError } = await dbClient
            .from('interviews')
            .upsert({
                id: interview.id,
                user_id: interview.userId,
                created_at: interview.createdAt,
                feedback: interview.feedback,
                messages: interview.messages,
                code: interview.code,
                problem_attempt_ids: interview.problemAttemptIds,
                tokens_deducted: true,
                tokens_used: tokensUsed
            });
        
    
        if (interviewError) {
            console.error('Error saving interview:', interviewError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to save interview' 
            });
        }

        const { data: userData } = await dbClient
            .from('users')
            .select('interview_ids')
            .eq('id', interview.userId)
            .single();
        
        const currentIds = userData?.interview_ids || [];
        if (!currentIds.includes(interview.id)) {
            await dbClient
                .from('users')
                .update({ interview_ids: [...currentIds, interview.id] })
                .eq('id', interview.userId);
        }

        return res.status(200).json({ 
            success: true, 
            interviewId: interview.id,
            tokensUsed
        });

    } catch (error) {
        console.error('Error saving interview:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to save interview' 
        });
    }
});

export default router
