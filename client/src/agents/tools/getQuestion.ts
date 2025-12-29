import { tool } from "@openai/agents";
import axios from "axios";
import { z } from 'zod';

export const getQuestionTool = tool({
    name: 'get_question',
    description: `REQUIRED: Fetches a coding problem for the interview.
    - Call this ONCE at the start of the technical portion
    - NEVER make up your own coding problems - always use this tool
    - Difficulty options: 'easy', 'medium', 'hard'
    - Present the problem WITHOUT mentioning data structures or algorithms`,
    parameters: z.object({difficulty: z.string()}),
    async execute({difficulty}) {
        const res = await axios.get(`http://localhost:3000/question/${difficulty}`)
        return res.data;
    }
})
