import {z} from 'zod'
import type { Message } from './message'

export type InterviewMode = 'full' | 'behavioral' | 'technical';

const TechnicalFeedback = z.object({
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
        timeComplexity: z.string(),
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
});

const BehavioralFeedback = z.object({
    score: z.number().min(1).max(10),
    responses: z.array(z.object({
        question: z.string(),
        competency: z.string(),
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
});

const InterviewFeedback = z.object({
    mode: z.enum(['full', 'behavioral', 'technical']).optional(),
    
    overallScore: z.number().min(1).max(10),
    overallSummary: z.string(),
    hireRecommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
    
    technical: TechnicalFeedback.optional(),
    behavioral: BehavioralFeedback.optional(),
    
    keyStrengths: z.array(z.string()),
    keyWeaknesses: z.array(z.string()),
    
    recommendations: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })),
    
    readyForRole: z.boolean(),
    suggestedNextSteps: z.string(),
    additionalComments: z.string().optional()
});

export type InterviewFeedback = z.infer<typeof InterviewFeedback>;
export type TechnicalFeedbackType = z.infer<typeof TechnicalFeedback>;
export type BehavioralFeedbackType = z.infer<typeof BehavioralFeedback>;

export type FeedbackStep = 'summary' | 'technical' | 'behavioral' | 'next_steps';

export interface FeedbackStepData {
    summary: {
        overallScore: number;
        overallSummary: string;
        hireRecommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
        keyStrengths: string[];
        keyWeaknesses: string[];
    };
    technical?: TechnicalFeedbackType;
    behavioral?: BehavioralFeedbackType;
    next_steps: {
        readyForRole: boolean;
        suggestedNextSteps: string;
        recommendations: Array<{
            area: string;
            suggestion: string;
            priority: 'high' | 'medium' | 'low';
        }>;
        additionalComments?: string;
    };
}

export const splitFeedbackIntoSteps = (feedback: InterviewFeedback): FeedbackStepData => {
    return {
        summary: {
            overallScore: feedback.overallScore,
            overallSummary: feedback.overallSummary,
            hireRecommendation: feedback.hireRecommendation,
            keyStrengths: feedback.keyStrengths,
            keyWeaknesses: feedback.keyWeaknesses,
        },
        technical: feedback.technical,
        behavioral: feedback.behavioral,
        next_steps: {
            readyForRole: feedback.readyForRole,
            suggestedNextSteps: feedback.suggestedNextSteps,
            recommendations: feedback.recommendations,
            additionalComments: feedback.additionalComments,
        }
    };
};

export const getFeedbackSteps = (feedback: InterviewFeedback): FeedbackStep[] => {
    const steps: FeedbackStep[] = ['summary'];
    
    if (feedback.technical) {
        steps.push('technical');
    }
    if (feedback.behavioral) {
        steps.push('behavioral');
    }
    
    steps.push('next_steps');
    return steps;
};

export const FEEDBACK_STEPS: FeedbackStep[] = ['summary', 'technical', 'behavioral', 'next_steps'];

export const FEEDBACK_STEP_TITLES: Record<FeedbackStep, string> = {
    summary: 'Interview Summary',
    technical: 'Technical Feedback',
    behavioral: 'Behavioral Feedback',
    next_steps: 'Recommendations & Next Steps'
};

export type Interview = {
    id: string;
    userId: string;
    createdAt: Date;
    feedback: InterviewFeedback | null;
    messages: Message[];
    code: string;
    problemAttemptIds: string[];
    mode?: InterviewMode;
};
