import { InterviewFeedback } from "./interviewFeedback";

export type Submission = {
    submittedAt: number;
    userCode: string;
    stdout: string;
    stderr: string;
}

export type ProblemAttempt = {
    id: string;
    interviewId: string;
    startedAt: number;
    language: string;
    version: string;
    feedback: InterviewFeedback | null;
    submissions: Submission[];
}

