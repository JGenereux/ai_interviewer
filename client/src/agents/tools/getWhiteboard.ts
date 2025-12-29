import { tool } from "@openai/agents";
import { z } from 'zod';

export const getWhiteboardTool = tool({
    name: 'get_whiteboard_image',
    description: `REQUIRED: You CANNOT see the whiteboard without calling this tool first.
    - ANY question about the whiteboard/drawing = MUST call this tool FIRST
    - You have NO visibility into what the user has drawn without this tool
    - NEVER assume, guess, or make up what's on the whiteboard
    - Each whiteboard check = fresh tool call (drawings change constantly)
    - If you describe whiteboard content without calling this tool, you are HALLUCINATING`,
    parameters: z.object({}),
    async execute() {
        return '';
    }
})