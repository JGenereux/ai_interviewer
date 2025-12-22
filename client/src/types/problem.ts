export type ProblemAttempt = {
    startedAt: number,
    problemId: number,
    language: string,
    version: string,
    submissions: Submission[]
}

export type Submission = {
    submittedAt: number,
    userCode: string,
    stdout: string,
    stderr: string
}