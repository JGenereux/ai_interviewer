import express from 'express'
const router = express.Router();

import { requireAuth, type AuthenticatedRequest } from '../middleware/auth'
import axios from 'axios'
import OpenAI from 'openai'
import { getFeedbackSchema, type InterviewMode } from '../Types/interviewFeedback';
import {zodTextFormat} from 'openai/helpers/zod'
import { z } from 'zod'
import dbClient from '../db/client'
import redis from '../db/redis'
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

const TOKENS_PER_SECOND = 50 / 60; // ~0.833 tokens per second (50 per minute)
const MIN_TOKENS_REQUIRED = 750;

const getUserCacheKey = (userId: string) => `user:${userId}`

const invalidateUserCache = async (userId: string) => {
    await redis.del(getUserCacheKey(userId))
}

const calculateTokensUsed = (createdAt: string | Date): number => {
    const createdAtStr = String(createdAt);
    const createdAtUTC = createdAtStr.endsWith('Z') || createdAtStr.includes('+') 
        ? createdAtStr 
        : createdAtStr + 'Z';
    const startedAt = new Date(createdAtUTC);
    const elapsedSeconds = (Date.now() - startedAt.getTime()) / 1000;
    return Math.max(1, Math.ceil(Math.max(0, elapsedSeconds) * TOKENS_PER_SECOND));
}

router.post('/start', requireAuth, async (req, res) => {
    try {
        const { mode } = req.body;
        const authUser = (req as AuthenticatedRequest).user;
        const userId = authUser.id;

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

        // Deduct tokens upfront to prevent abuse
        const newTokenBalance = userData.tokens - MIN_TOKENS_REQUIRED;
        const { error: tokenDeductError } = await dbClient
            .from('users')
            .update({ tokens: newTokenBalance })
            .eq('id', userId);

        if (tokenDeductError) {
            console.error('Error deducting tokens upfront:', tokenDeductError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to reserve tokens for interview' 
            });
        }

        await invalidateUserCache(userId);
        const interviewId = crypto.randomUUID();

        const { error: insertError } = await dbClient
            .from('interviews')
            .insert({
                id: interviewId,
                user_id: userId,
                mode: mode || 'full',
                feedback: null,
                messages: [],
                code: '',
                problem_attempt_ids: [],
                tokens_prepaid: MIN_TOKENS_REQUIRED,
                status: 'active'
            });

        if (insertError) {
            console.error('Error creating interview:', insertError);
            // Refund the tokens if interview creation fails
            await dbClient
                .from('users')
                .update({ tokens: userData.tokens })
                .eq('id', userId);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to create interview' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            interviewId,
            tokensPrepaid: MIN_TOKENS_REQUIRED,
            newTokenBalance
        });

    } catch (error) {
        console.error('Error starting interview:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to start interview' 
        });
    }
});

router.post('/feedback', requireAuth, async (req, res) => {
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

router.post('/execute', requireAuth, async (req, res) => {
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


router.post('/save', requireAuth, async (req, res) => {
    try {
        const { interview, problemAttempts } = req.body as { 
            interview: Interview, 
            problemAttempts: ProblemAttempt[] 
        };
        const authUser = (req as AuthenticatedRequest).user;

        if (!interview || !interview.id || !interview.userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid interview data' 
            });
        }

        if (authUser.id !== interview.userId) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        const [interviewResult, userResult] = await Promise.all([
            dbClient.from('interviews')
                .select('created_at, tokens_deducted, tokens_prepaid')
                .eq('id', interview.id)
                .single(),
            dbClient.from('users')
                .select('tokens, interview_ids')
                .eq('id', interview.userId)
                .single()
        ]);

        if (interviewResult.error || !interviewResult.data) {
            console.error('Error fetching interview:', interviewResult.error);
            return res.status(404).json({ 
                success: false, 
                error: 'Interview not found' 
            });
        }

        if (userResult.error || !userResult.data) {
            console.error('Error fetching user:', userResult.error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch user data' 
            });
        }

        const existingInterview = interviewResult.data;
        const userData = userResult.data;

        let tokensUsed = 0;
        let newTokenBalance: number | null = null;
        let needsCacheInvalidation = false;

        if (!existingInterview.tokens_deducted && existingInterview.created_at) {
            tokensUsed = calculateTokensUsed(existingInterview.created_at);
            const tokensPrepaid = existingInterview.tokens_prepaid || MIN_TOKENS_REQUIRED;
            const tokenDifference = tokensUsed - tokensPrepaid;

            newTokenBalance = userData.tokens;
            if (tokenDifference > 0) {
                newTokenBalance = Math.max(0, userData.tokens - tokenDifference);
            } else if (tokenDifference < 0) {
                newTokenBalance = userData.tokens + Math.abs(tokenDifference);
            }
            needsCacheInvalidation = true;
        }

        const currentIds = userData.interview_ids || [];
        const needsIdUpdate = !currentIds.includes(interview.id);

        if (problemAttempts && problemAttempts.length > 0) {
            const attemptRecords = problemAttempts.map(attempt => ({
                interview_id: attempt.interviewId,
                started_at: attempt.startedAt,
                language: attempt.language,
                version: attempt.version,
                feedback: attempt.feedback,
                submissions: attempt.submissions
            }));

            const { error: attemptError } = await dbClient
                .from('problem_attempts')
                .upsert(attemptRecords);

            if (attemptError) {
                console.error('Error saving problem attempts:', attemptError);
                return res.status(500).json({ 
                    success: false, 
                    error: 'Failed to save problem attempts' 
                });
            }
        }

        const userUpdate: Record<string, any> = {};
        if (newTokenBalance !== null) userUpdate.tokens = newTokenBalance;
        if (needsIdUpdate) userUpdate.interview_ids = [...currentIds, interview.id];

        const [interviewSaveResult, userUpdateResult] = await Promise.all([
            dbClient.from('interviews').upsert({
                id: interview.id,
                user_id: interview.userId,
                created_at: interview.createdAt,
                feedback: interview.feedback,
                messages: interview.messages,
                code: interview.code,
                problem_attempt_ids: interview.problemAttemptIds,
                tokens_deducted: true,
                tokens_used: tokensUsed
            }),
            Object.keys(userUpdate).length > 0
                ? dbClient.from('users').update(userUpdate).eq('id', interview.userId)
                : Promise.resolve({ error: null })
        ]);

        if (interviewSaveResult.error) {
            console.error('Error saving interview:', interviewSaveResult.error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to save interview' 
            });
        }

        if (userUpdateResult.error) {
            console.error('Error updating user:', userUpdateResult.error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update user data' 
            });
        }

        if (Object.keys(userUpdate).length > 0) {
            needsCacheInvalidation = true;
        }

        if (needsCacheInvalidation) {
            await invalidateUserCache(interview.userId);
        }

        return res.status(200).json({ 
            success: true, 
            interviewId: interview.id,
            tokensUsed,
            newTokenBalance
        });

    } catch (error) {
        console.error('Error saving interview:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to save interview' 
        });
    }
});

// End interview and finalize token calculation
router.post('/end', requireAuth, async (req, res) => {
    try {
        const { interviewId } = req.body;

        if (!interviewId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Interview ID is required' 
            });
        }

        // Fetch interview details
        const { data: interview, error: fetchError } = await dbClient
            .from('interviews')
            .select('id, user_id, created_at, tokens_prepaid, status, ended_at')
            .eq('id', interviewId)
            .single();

        if (fetchError || !interview) {
            console.error('Error fetching interview:', fetchError);
            return res.status(404).json({ 
                success: false, 
                error: 'Interview not found' 
            });
        }

        const authUser = (req as AuthenticatedRequest).user;
        if (authUser.id !== interview.user_id) {
            return res.status(403).json({ success: false, error: 'Forbidden' });
        }

        if (interview.status === 'completed' || interview.status === 'abandoned') {
            return res.status(200).json({ 
                success: true, 
                message: 'Interview already ended',
                interviewId: interview.id
            });
        }

        const endedAt = new Date();
        const tokensUsed = calculateTokensUsed(interview.created_at);
        console.log(tokensUsed)
        const tokensPrepaid = interview.tokens_prepaid || MIN_TOKENS_REQUIRED;
        const tokenDifference = tokensUsed - tokensPrepaid;

        const { data: userData, error: userFetchError } = await dbClient
            .from('users')
            .select('tokens, interview_ids')
            .eq('id', interview.user_id)
            .single();

        if (userFetchError || !userData) {
            console.error('Error fetching user:', userFetchError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch user data' 
            });
        }

        let newTokenBalance = userData.tokens;
        if (tokenDifference > 0) {
            newTokenBalance = Math.max(0, userData.tokens - tokenDifference);
        } else if (tokenDifference < 0) {
            newTokenBalance = userData.tokens + Math.abs(tokenDifference);
        }

        const currentIds = userData.interview_ids || [];
        const needsIdUpdate = !currentIds.includes(interviewId);
        const userUpdate: Record<string, any> = { tokens: newTokenBalance };
        if (needsIdUpdate) {
            userUpdate.interview_ids = [...currentIds, interviewId];
        }

        const [userUpdateResult, interviewUpdateResult] = await Promise.all([
            dbClient.from('users').update(userUpdate).eq('id', interview.user_id),
            dbClient.from('interviews').update({
                ended_at: endedAt.toISOString(),
                status: 'completed',
                tokens_deducted: true,
                tokens_used: tokensUsed
            }).eq('id', interviewId)
        ]);

        if (userUpdateResult.error) {
            console.error('Error updating user:', userUpdateResult.error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update token balance' 
            });
        }

        if (interviewUpdateResult.error) {
            console.error('Error updating interview:', interviewUpdateResult.error);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to update interview status' 
            });
        }

        await invalidateUserCache(interview.user_id);

        return res.status(200).json({ 
            success: true, 
            interviewId,
            tokensUsed,
            tokensPrepaid,
            tokenDifference,
            newBalance: newTokenBalance
        });

    } catch (error) {
        console.error('Error ending interview:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to end interview' 
        });
    }
});

// Cleanup abandoned interviews (call this periodically or on user login)
router.post('/cleanup-abandoned', requireAuth, async (req, res) => {
    try {
        const ABANDONED_THRESHOLD_MINUTES = 60; // Mark as abandoned after 60 minutes

        // Find active interviews older than threshold
        const thresholdTime = new Date(Date.now() - ABANDONED_THRESHOLD_MINUTES * 60 * 1000);
        
        const { data: abandonedInterviews, error: fetchError } = await dbClient
            .from('interviews')
            .select('id, user_id, created_at, tokens_prepaid')
            .eq('status', 'active')
            .lt('created_at', thresholdTime.toISOString());

        if (fetchError) {
            console.error('Error fetching abandoned interviews:', fetchError);
            return res.status(500).json({ 
                success: false, 
                error: 'Failed to fetch abandoned interviews' 
            });
        }

        if (!abandonedInterviews || abandonedInterviews.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No abandoned interviews found',
                processed: 0
            });
        }

        let processed = 0;
        for (const interview of abandonedInterviews) {
            const tokensUsed = Math.min(
                calculateTokensUsed(interview.created_at),
                interview.tokens_prepaid || MIN_TOKENS_REQUIRED
            );

            await dbClient
                .from('interviews')
                .update({
                    ended_at: new Date().toISOString(),
                    status: 'abandoned',
                    tokens_deducted: true,
                    tokens_used: tokensUsed
                })
                .eq('id', interview.id);

            processed++;
        }

        return res.status(200).json({ 
            success: true, 
            message: `Processed ${processed} abandoned interviews`,
            processed
        });

    } catch (error) {
        console.error('Error cleaning up abandoned interviews:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Failed to cleanup abandoned interviews' 
        });
    }
});

router.post('/generate-hint', requireAuth, async (req, res) => {
    try {
        const { code, problemDescription } = req.body;

        if (!code || !problemDescription) {
            return res.status(400).json({ 
                success: false, 
                error: 'Code and problem description are required' 
            });
        }

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const hintSchema = z.object({
            start: z.number().describe('Starting line number of the code section that needs fixing'),
            end: z.number().describe('Ending line number of the code section that needs fixing'),
            code: z.string().describe('A small code snippet hint (1-3 lines max) to nudge the user in the right direction')
        });

        const response = await client.responses.parse({
            model: "gpt-4o-2024-08-06",
            input: [
                { 
                    role: "system", 
                    content: `You are a helpful coding interview assistant that provides MINIMAL hints.

RULES:
- Generate hints that are 1-3 lines of code MAXIMUM
- NEVER provide the full solution
- Focus on the smallest possible nudge to unblock the user
- Identify the specific lines that need work
- Your hint should guide, not solve

The hint should help them realize what's wrong without doing the work for them.`
                },
                { 
                    role: "user", 
                    content: `Problem: ${problemDescription}

User's current code:
${code}

Analyze the code and provide a small hint (1-3 lines max) that points them toward fixing their issue. Identify which lines need attention and provide a minimal code snippet that nudges them in the right direction.`
                },
            ],
            text: {
                format: zodTextFormat(hintSchema, "code_hint"),
            },
        });

        return res.status(200).json({
            success: true,
            hint: response.output_parsed
        });

    } catch (error) {
        console.error('Error generating hint:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to generate hint'
        });
    }
});

export default router
