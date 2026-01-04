import { tool } from "@openai/agents";
import { z } from 'zod';
import { interpretWhiteboard, WhiteboardTooLargeError } from "@/utils/interpretWhiteboard";

export interface WhiteboardContext {
    captureWhiteboard: () => Promise<string>;
    getAuthToken: () => string | null;
    setInterpreting: (value: boolean) => void;
}

export const createGetWhiteboardTool = (ctx: WhiteboardContext) => tool({
    name: 'get_whiteboard_image',
    description: `REQUIRED: You CANNOT see the whiteboard without calling this tool first.
    - ANY question about the whiteboard/drawing = MUST call this tool FIRST
    - You have NO visibility into what the user has drawn without this tool
    - NEVER assume, guess, or make up what's on the whiteboard
    - Each whiteboard check = fresh tool call (drawings change constantly)
    - If you describe whiteboard content without calling this tool, you are HALLUCINATING`,
    parameters: z.object({}),
    async execute() {
        ctx.setInterpreting(true);
        try {
            const dataUrl = await ctx.captureWhiteboard();
            const authToken = ctx.getAuthToken();
            const interpretation = await interpretWhiteboard(dataUrl, authToken);
            return interpretation;
        } catch (error) {
            console.error('Failed to capture/interpret whiteboard:', error);
            if (error instanceof WhiteboardTooLargeError) {
                return 'I cannot view the whiteboard right now as there is too much content on it for me to process. Please ask the candidate to describe what they have drawn, or have them simplify their drawing.';
            }
            return 'Unable to analyze the whiteboard at this time. Please ask the candidate to describe what they have drawn.';
        } finally {
            ctx.setInterpreting(false);
        }
    }
});
