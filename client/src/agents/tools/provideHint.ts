import { tool } from "@openai/agents";
import { z } from 'zod';
import axios from 'axios';

export interface HintContext {
    getCode: () => string;
    getProblemDescription: () => string;
}

export const createProvideHintTool = (ctx: HintContext) => tool({
    name: 'provide_hint',
    description: `Call this when the user explicitly asks for a CODE hint.
    - Only call after user confirms they want a code hint (not approach help)
    - The system will generate a small targeted hint (1-3 lines)
    - This visually highlights lines that need attention`,
    parameters: z.object({}),
    async execute() {
        const code = ctx.getCode();
        const problemDescription = ctx.getProblemDescription();

        const response = await axios.post(`${import.meta.env.VITE_API_URL}/interview/generate-hint`, {
            code,
            problemDescription
        });

        if (!response.data.success) {
            return { error: 'Failed to generate hint' };
        }

        return response.data.hint;
    }
});
