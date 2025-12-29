import { tool } from "@openai/agents";
import { z } from 'zod';

export const getUserCodeTool = tool({
    name: 'get_user_code',
    description: `REQUIRED: You CANNOT see the user's code without calling this tool first.
    - ANY question about code = MUST call this tool FIRST
    - ANY code review, debugging, or hint = MUST call this tool FIRST
    - Code changes constantly - ALWAYS call fresh, never assume previous code is current
    - If you discuss code without calling this tool, your response will be WRONG
    - Call this BEFORE: reviewing code, giving hints, checking syntax, debugging errors`,
    parameters: z.object({}),
    async execute() {
        return '';
    }
})