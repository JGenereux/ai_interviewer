import { RealtimeAgent} from '@openai/agents/realtime';
import { createGetQuestionTool } from './tools/getQuestion';
import { createGetUserCodeTool } from './tools/getUserCode';
import { technicalPrompt } from './prompts/technicalPrompt';
import { createGetWhiteboardTool } from './tools/getWhiteboard';
import { createProvideHintTool } from './tools/provideHint';
import type { Language } from '@/types/language';

export interface TechnicalAgentContext {
    getSelectedLanguage: () => Language;
    getAuthToken: () => string | null;
    captureWhiteboard: () => Promise<string>;
    getCode: () => string;
    getProblemDescription: () => string;
    setInterpreting: (value: boolean) => void;
}

export const createTechnicalAgent = (ctx: TechnicalAgentContext) => {
    const getQuestionTool = createGetQuestionTool({
        getSelectedLanguage: ctx.getSelectedLanguage,
        getAuthToken: ctx.getAuthToken
    });
    const getWhiteboardTool = createGetWhiteboardTool({ 
        captureWhiteboard: ctx.captureWhiteboard,
        getAuthToken: ctx.getAuthToken,
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
