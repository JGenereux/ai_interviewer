import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { behavioralAgent } from './behavioral';
import { createTechnicalAgent, type TechnicalAgentContext } from './technical';
import { getOrchestratorPrompt } from './prompts/orchestratorPrompt';
import { getFeedbackTool } from './tools/getFeedback';
import type { InterviewMode } from '@/components/startInterview';

export interface CoordinatorContext {
    getSession: () => RealtimeSession | null;
    setPendingEnd: (value: boolean) => void;
}

export const createEndInterviewTool = (ctx: CoordinatorContext) => tool({
    name: 'end_interview',
    description: 'End the interview and disconnect the call. Use this when the interview is complete or the user requests (do not be persistent on not ending it).',
    parameters: z.object({}),
    async execute() {
        ctx.setPendingEnd(true);
        const session = ctx.getSession();
        if (session) {
            session.mute(true);
        }
        return 'Interview ending... waiting for final remarks.';
    }
});

export const createCoordinatorAgent = (ctx: CoordinatorContext, mode: InterviewMode = 'full', technicalCtx?: TechnicalAgentContext) => {
    const endInterviewTool = createEndInterviewTool(ctx);
    const technicalAgent = technicalCtx ? createTechnicalAgent(technicalCtx) : null;

    const handoffs = (() => {
        switch (mode) {
            case 'behavioral':
                return [behavioralAgent];
            case 'technical':
                return technicalAgent ? [technicalAgent] : [];
            case 'full':
            default:
                return technicalAgent ? [behavioralAgent, technicalAgent] : [behavioralAgent];
        }
    })();

    const agent = new RealtimeAgent({
        name: 'Coordinator',
        instructions: getOrchestratorPrompt(mode),
        handoffs,
        tools: [endInterviewTool, getFeedbackTool],
        handoffDescription: 'Responsible for coordinating the interview and evaluating the interview.'
    });

    if (mode === 'full' || mode === 'behavioral') {
        behavioralAgent.handoffs = [agent];
    }
    if ((mode === 'full' || mode === 'technical') && technicalAgent) {
        technicalAgent.handoffs = [agent];
    }

    return agent;
};
