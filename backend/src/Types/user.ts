import { InterviewFeedback } from "./interviewFeedback";

type UserType = {
    id: string | null;
    createdAt: Date;
    fullName: string | null;
    xp: number;
    resume: InterviewFeedback;
    userName: string;
    attemptedProblems: string[];
}

export default UserType