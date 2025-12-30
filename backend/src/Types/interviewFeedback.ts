import {z} from 'zod'

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

export const FullInterviewFeedback = z.object({
    overallScore: z.number().min(1).max(10),
    overallSummary: z.string(),
    hireRecommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
    technical: TechnicalFeedback,
    behavioral: BehavioralFeedback,
    keyStrengths: z.array(z.string()),
    keyWeaknesses: z.array(z.string()),
    recommendations: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })),
    readyForRole: z.boolean(),
    suggestedNextSteps: z.string(),
    additionalComments: z.string()
});

export const BehavioralOnlyFeedback = z.object({
    overallScore: z.number().min(1).max(10),
    overallSummary: z.string(),
    hireRecommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
    behavioral: BehavioralFeedback,
    keyStrengths: z.array(z.string()),
    keyWeaknesses: z.array(z.string()),
    recommendations: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })),
    readyForRole: z.boolean(),
    suggestedNextSteps: z.string(),
    additionalComments: z.string()
});

export const TechnicalOnlyFeedback = z.object({
    overallScore: z.number().min(1).max(10),
    overallSummary: z.string(),
    hireRecommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']),
    technical: TechnicalFeedback,
    keyStrengths: z.array(z.string()),
    keyWeaknesses: z.array(z.string()),
    recommendations: z.array(z.object({
        area: z.string(),
        suggestion: z.string(),
        priority: z.enum(['high', 'medium', 'low'])
    })),
    readyForRole: z.boolean(),
    suggestedNextSteps: z.string(),
    additionalComments: z.string()
});

export type InterviewFeedback = z.infer<typeof FullInterviewFeedback> | z.infer<typeof BehavioralOnlyFeedback> | z.infer<typeof TechnicalOnlyFeedback>;

export function getFeedbackSchema(mode: InterviewMode) {
    switch (mode) {
        case 'behavioral':
            return BehavioralOnlyFeedback;
        case 'technical':
            return TechnicalOnlyFeedback;
        case 'full':
        default:
            return FullInterviewFeedback;
    }
}

export default FullInterviewFeedback
