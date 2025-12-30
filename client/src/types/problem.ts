import type { InterviewFeedback } from "./interview"

export type ProblemAttempt = {
    id?: string,
    startedAt: number,
    problemId: number,
    language: string,
    version: string,
    feedback: InterviewFeedback | null,
    submissions: Submission[]
}

export type Submission = {
    submittedAt: number,
    userCode: string,
    stdout: string,
    stderr: string
}