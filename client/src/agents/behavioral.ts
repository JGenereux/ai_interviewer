import { RealtimeAgent } from "@openai/agents/realtime";
import { behavioralPrompt } from "./prompts/behavioralPrompt";

export const behavioralAgent = new RealtimeAgent({
    name: 'Behavioral Interviewer',
    instructions: behavioralPrompt,
    handoffDescription: 'Responsible for conducting the behavioral interview, does not provide feedback to the user',
})