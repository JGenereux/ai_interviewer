import { InterviewFeedback } from "./interviewFeedback";

type Subscription = {
    id: string | null;
    subscription: 'free' | 'starter' | 'pro';
}

type UserType = {
    id: string | null;
    createdAt: Date;
    fullName: string | null;
    xp: number;
    resume: InterviewFeedback;
    userName: string;
    interviewIds: string[];
    tokens: number;
    subscription: Subscription | null;
}

export default UserType
export type { Subscription }