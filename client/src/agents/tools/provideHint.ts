import { tool } from "@openai/agents";
import { z } from 'zod';

export const provideHintTool = tool({
    name: 'provide_hint',
    description: "Used to provide the user a hint. Should provide the range of the lines of the code as start-end and the string of the code snippet",
    parameters: z.object({start: z.number(), end: z.number(), code: z.string()}),
    async execute({start, end, code}) {
        return {start, end, code};
    }
})