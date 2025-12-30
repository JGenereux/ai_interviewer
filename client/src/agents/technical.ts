import { RealtimeAgent} from '@openai/agents/realtime';
import { createGetQuestionTool } from './tools/getQuestion';
import { getUserCodeTool } from './tools/getUserCode';
import { technicalPrompt } from './prompts/technicalPrompt';
import { getWhiteboardTool } from './tools/getWhiteboard';
import { provideHintTool } from './tools/provideHint';
import type { Language } from '@/types/language';

export interface TechnicalAgentContext {
    getSelectedLanguage: () => Language;
}

export const createTechnicalAgent = (ctx: TechnicalAgentContext) => {
    const getQuestionTool = createGetQuestionTool(ctx);
    
    return new RealtimeAgent({
        name: 'Problem Interviewer',
        instructions: technicalPrompt,
        tools: [getQuestionTool, getUserCodeTool, getWhiteboardTool, provideHintTool],
        handoffDescription: 'Responsible for conducting the coding problem solving interview, does not provide feedback to the user'
    });
};
