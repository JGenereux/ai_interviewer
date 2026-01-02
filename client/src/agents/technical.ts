import { RealtimeAgent} from '@openai/agents/realtime';
import { createGetQuestionTool } from './tools/getQuestion';
import { createGetUserCodeTool } from './tools/getUserCode';
import { technicalPrompt } from './prompts/technicalPrompt';
import { createGetWhiteboardTool } from './tools/getWhiteboard';
import { createProvideHintTool } from './tools/provideHint';
import type { Language } from '@/types/language';

export interface TechnicalAgentContext {
    getSelectedLanguage: () => Language;
    captureWhiteboard: () => Promise<string>;
    getCode: () => string;
    getProblemDescription: () => string;
    setInterpreting: (value: boolean) => void;
}

export const createTechnicalAgent = (ctx: TechnicalAgentContext) => {
    const getQuestionTool = createGetQuestionTool(ctx);
    const getWhiteboardTool = createGetWhiteboardTool({ 
        captureWhiteboard: ctx.captureWhiteboard,
        setInterpreting: ctx.setInterpreting
    });
    const getUserCodeTool = createGetUserCodeTool({ getCode: ctx.getCode });
    const provideHintTool = createProvideHintTool({
        getCode: ctx.getCode,
        getProblemDescription: ctx.getProblemDescription
    });
    
    return new RealtimeAgent({
        name: 'Problem Interviewer',
        instructions: technicalPrompt,
        tools: [getQuestionTool, getUserCodeTool, getWhiteboardTool, provideHintTool],
        handoffDescription: 'Responsible for conducting the coding problem solving interview, does not provide feedback to the user'
    });
};
