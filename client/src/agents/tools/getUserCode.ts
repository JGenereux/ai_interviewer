import { tool } from "@openai/agents";
import { z } from 'zod';

export interface UserCodeContext {
    getCode: () => string;
}

export const createGetUserCodeTool = (ctx: UserCodeContext) => tool({
    name: 'get_user_code',
    description: `REQUIRED: You CANNOT see the user's code without calling this tool first.
    - ANY question about code = MUST call this tool FIRST
    - ANY code review, debugging, or hint = MUST call this tool FIRST
    - Code changes constantly - ALWAYS call fresh, never assume previous code is current
    - If you discuss code without calling this tool, your response will be WRONG
    - Call this BEFORE: reviewing code, giving hints, checking syntax, debugging errors`,
    parameters: z.object({}),
    async execute() {
        const code = ctx.getCode();
        const split = code.split('\n');
        const lines = split.map((content, i) => ({ content, lineNumber: i + 1 }));
        return JSON.stringify(lines);
    }
});
