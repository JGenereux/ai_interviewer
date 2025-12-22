import { RealtimeAgent } from "@openai/agents/realtime";

export const behavioralAgent = new RealtimeAgent({
    name: 'Behavioral Interviewer',
    instructions: 'You are interviewing a candidate for a software engineering internship role. Ask 1 question no more. Once the interview is over handoff to the orchestrator to continue the other parts of the interview.',
    handoffDescription: 'Responsible for conducting the behavioral interview, does not provide feedback to the user',
})