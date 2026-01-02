import { InterviewFeedback } from "./interviewFeedback";

export type Message = {
    role: 'user' | 'agent';
    id: string;
    content: string;
    event_id: string;
    created: number;
}

export type InterviewStatus = 'active' | 'completed' | 'abandoned';

export type Interview = {
    id: string;
    userId: string;
    createdAt: Date;
    feedback: InterviewFeedback | null;
    messages: Message[];
    code: string;
    problemAttemptIds: string[];
    tokensPrepaid?: number;
    tokensUsed?: number;
    endedAt?: Date | null;
    status?: InterviewStatus;
}

