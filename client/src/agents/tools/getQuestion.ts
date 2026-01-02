import { tool } from "@openai/agents";
import axios from "axios";
import { z } from 'zod';
import type { Language } from '@/types/language';

export interface GetQuestionContext {
    getSelectedLanguage: () => Language;
}

export const createGetQuestionTool = (ctx: GetQuestionContext) => tool({
    name: 'get_question',
    description: `REQUIRED: Fetches a coding problem for the interview.
    - Call this ONCE at the start of the technical portion
    - NEVER make up your own coding problems - always use this tool
    - Difficulty options: 'easy', 'medium', 'hard'
    - Present the problem WITHOUT mentioning data structures or algorithms`,
    parameters: z.object({difficulty: z.string()}),
    async execute({difficulty}) {
        const language = ctx.getSelectedLanguage();
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/question/${difficulty}?language=${language.language}`);
        return { ...res.data, selectedLanguage: language };
    }
});
