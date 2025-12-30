import {z} from 'zod'

const InterviewFeedbackOutput = z.object({
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

export type InterviewFeedback = z.infer<typeof InterviewFeedbackOutput>;

export default InterviewFeedbackOutput