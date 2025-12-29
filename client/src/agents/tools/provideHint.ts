import { tool } from "@openai/agents";
import { z } from 'zod';

export const provideHintTool = tool({
    name: 'provide_hint',
    description: `REQUIRED when giving code hints or suggestions.
    - MUST call get_user_code FIRST before calling this tool
    - Use this to highlight specific lines that need fixing
    - start/end = line numbers of the code section to fix
    - code = the corrected code snippet for those lines
    - This visually shows the user where to make changes`,
    parameters: z.object({start: z.number(), end: z.number(), code: z.string()}),
    async execute({start, end, code}) {
        return {start, end, code};
    }
})