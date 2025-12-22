import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { tool } from '@openai/agents';
import { z } from 'zod';
import { behavioralAgent } from './behavioral';
import { techincalAgent } from './technical';
import { orchestratorPrompt } from './prompts/orchestratorPrompt';

export interface EndInterviewContext {
    getSession: () => RealtimeSession | null;
    setPendingEnd: (value: boolean) => void;
}

export const createEndInterviewTool = (ctx: EndInterviewContext) => tool({
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

export const createCoordinatorAgent = (ctx: EndInterviewContext) => {
    const endInterviewTool = createEndInterviewTool(ctx);

    const agent = new RealtimeAgent({
        name: 'Coordinator',
        instructions: orchestratorPrompt,
        handoffs: [behavioralAgent, techincalAgent],
        tools: [endInterviewTool],
        handoffDescription: 'Responsible for coordinating the interview and evaluating the interview.'
    });

    behavioralAgent.handoffs = [agent];
    techincalAgent.handoffs = [agent];

    return agent;
};

