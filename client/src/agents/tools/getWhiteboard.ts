import { tool } from "@openai/agents";
import { z } from 'zod';

export const getWhiteboardTool = tool({
    name: 'get_whiteboard_image',
    description: "Provides a direct snapshot of the whiteboard. Use this tool to get the user's current drawing on the whiteboard. Triggers an event so dev can dynamically send the user's whiteboard using sendMessage",
    parameters: z.object({}),
    async execute() {
        return '';
    }
})