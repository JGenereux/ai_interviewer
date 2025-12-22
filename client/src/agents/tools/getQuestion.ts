import { tool } from "@openai/agents";
import axios from "axios";
import { z } from 'zod';

export const getQuestionTool = tool({
    name: 'get_question',
    description: "Return's a leetcode style coding question. Use this at the start of the interview.",
    parameters: z.object({}),
    async execute() {
        const res = await axios.get('http://localhost:3000/question')
        return res.data;
    }
})
