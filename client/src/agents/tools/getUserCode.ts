import { tool } from "@openai/agents";
import { z } from 'zod';

export const getUserCodeTool = tool({
    name: 'get_user_code',
    description: "Use this tool to get the user's current code. Activates a tool call to get_user_code so dev can dynamically send the code using sendMessage",
    parameters: z.object({}),
    async execute() {
        return '';
    }
})