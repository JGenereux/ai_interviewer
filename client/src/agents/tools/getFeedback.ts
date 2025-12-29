import { tool } from "@openai/agents";
import { z } from 'zod';

export const getFeedbackTool = tool({
    name: 'get_feedback',
    description: "Used to trigger a event so user can dynamically get feedback which will then be fed to the agent that called this tool so it can provide feedback for the interview.",
    parameters: z.object({}),
    async execute() {
       return ' ';
    }
})