import { RealtimeAgent} from '@openai/agents/realtime';
import { getQuestionTool } from './tools/getQuestion';
import { getUserCodeTool } from './tools/getUserCode';
import { technicalPrompt } from './prompts/technicalPrompt';
import { getLanguagesTool, getLanguageTool } from './tools/getLanguages';
import { getWhiteboardTool } from './tools/getWhiteboard';
import { provideHintTool } from './tools/provideHint';

export const techincalAgent = new RealtimeAgent({
    name: 'Problem Interviewer',
    instructions: technicalPrompt,
    tools: [getQuestionTool, getUserCodeTool, getLanguageTool, getLanguagesTool, getWhiteboardTool, provideHintTool],
    handoffDescription: 'Responsible for conducting the coding problem solving interview, does not provide feedback to the user'
})