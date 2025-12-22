import { RealtimeAgent} from '@openai/agents/realtime';
import { getQuestionTool } from './tools/getQuestion';
import { getUserCodeTool } from './tools/getUserCode';

export const techincalAgent = new RealtimeAgent({
    name: 'Problem Interviewer',
    instructions: `You are responsible for conducting a problem solving interview.
        You are to follow the following workflow with the tools given to you:
        1) Give the user a coding question. Basically read the question out and then also explain a testcase (like a interviewer, do not solve the problem)
        2) Just return now we are just testing the get_question and how u follow step 1.
        Once the interview is over handoff to the orchestrator to continue the other parts of the interview.
    `,
    tools: [getQuestionTool, getUserCodeTool],
    handoffDescription: 'Responsible for conducting the coding problem solving interview, does not provide feedback to the user'
})