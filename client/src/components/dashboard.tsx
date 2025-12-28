import { createCoordinatorAgent } from "@/agents/orchestrator";
import { OpenAIRealtimeWebRTC } from "@openai/agents/realtime";
import { RealtimeSession } from "@openai/agents/realtime";

import { useRef, useState, useCallback, useEffect } from "react";
import axios from "axios";
import StartInterview from "./startInterview";
import { Card } from "./ui/card";
import type { Message } from "@/types/message";
import Whiteboard from "./whiteboard";
import { eventToMessage } from "@/utils/sessionEvents";
import ToolBar from "./dashboard/toolbar";
import { AudioWave } from "./dashboard/audioWave";
import GradualSpacing from "./dashboard/agentText";
import type { AgentStatus } from "@/types/agentStatus";
import { Agent } from "@openai/agents";
import type { Language } from "@/types/language";
import type { ProblemAttempt, Submission } from "@/types/problem";
import type { Hint } from "@/types/hint";
import { Editor } from "@monaco-editor/react";
import { Button } from "./ui/button";
import type { InterviewFeedback } from "@/types/interview";
import DisplayFeedback from "./dashboard/displayFeedback";

let pendingEnd = false;

export const defaultInterviewFeedback: InterviewFeedback = {
    // Overall Assessment
    overallScore: 7,
    overallSummary: "The candidate demonstrated solid problem-solving skills and good communication throughout the interview. They successfully solved the technical problem with an optimal solution after some guidance. Behavioral responses showed good self-awareness and relevant experience, though some answers could have been more specific using the STAR method.",
    hireRecommendation: 'yes',

    // Technical Portion
    technical: {
        score: 7,
        problemSolvingApproach: {
            rating: 4,
            feedback: "Candidate took a methodical approach to the problem. Started with a brute force solution and was able to optimize with hints. Good at thinking through edge cases once prompted.",
            strengths: [
                "Identified the core problem quickly",
                "Asked clarifying questions about input constraints",
                "Walked through examples before coding"
            ],
            weaknesses: [
                "Didn't immediately consider optimal approach",
                "Needed prompting to think about edge cases"
            ]
        },
        codeQuality: {
            rating: 4,
            feedback: "Code was clean and well-structured with meaningful variable names. Good use of helper functions.",
            readability: "Very readable code with clear variable names and logical flow",
            efficiency: "Achieved optimal O(n) time complexity after optimization discussion",
            edgeCaseHandling: "Handled most edge cases including empty arrays and single elements after prompting"
        },
        complexity: {
            understoodComplexity: true,
            timeComplexity: "O(n)",
            spaceComplexity: "O(1)",
            optimalSolution: true,
            feedback: "Demonstrated good understanding of time/space complexity. Was able to explain the trade-offs between different approaches clearly."
        },
        communication: {
            rating: 4,
            feedback: "Strong communication throughout. Explained thought process clearly and was receptive to hints.",
            explainedApproach: true,
            askedClarifyingQuestions: true,
            thoughtProcess: "Verbalized their thinking process well, making it easy to follow their logic"
        },
        debugging: {
            rating: 3,
            feedback: "Took 3 attempts to get a fully passing solution. Good at identifying issues from error messages but could be faster at debugging.",
            identifiedIssues: true,
            numberOfAttempts: 3,
            persistedThroughFailures: true
        },
        highlights: [
            "Excellent communication and explanation of approach",
            "Clean, readable code with good naming conventions",
            "Successfully optimized to optimal solution"
        ],
        areasForImprovement: [
            "Consider optimal approaches earlier in problem-solving",
            "Practice recognizing common patterns faster",
            "Improve debugging speed"
        ]
    },

    // Behavioral Portion
    behavioral: {
        score: 7,
        responses: [
            {
                question: "Tell me about a time you had to resolve a conflict with a team member",
                competency: "conflict_resolution",
                rating: 4,
                feedback: "Good example that showed maturity and professionalism. Used STAR method effectively.",
                usedSTARMethod: true,
                specificityLevel: 'specific',
                strengths: [
                    "Clear situation setup",
                    "Explained their specific actions",
                    "Positive resolution with measurable outcome"
                ],
                weaknesses: [
                    "Could have elaborated more on what they learned from the experience"
                ]
            },
            {
                question: "Describe a technical challenge you overcame",
                competency: "problem_solving",
                rating: 3,
                feedback: "Relevant example but lacked some specificity in the technical details and outcome metrics.",
                usedSTARMethod: false,
                specificityLevel: 'moderate',
                strengths: [
                    "Showed persistence and determination",
                    "Mentioned collaboration with team"
                ],
                weaknesses: [
                    "Didn't use STAR structure",
                    "Could have been more specific about technical approach",
                    "Missing clear outcome/impact metrics"
                ]
            }
        ],
        overallCommunication: {
            clarity: 4,
            conciseness: 3,
            professionalism: 5,
            feedback: "Professional and articulate throughout. Answers were sometimes a bit long but generally well-structured."
        },
        culturalFit: {
            rating: 4,
            feedback: "Values align well with company culture. Shows strong emphasis on collaboration and continuous learning.",
            alignment: [
                "Values teamwork and collaboration",
                "Growth mindset and willingness to learn",
                "Takes ownership of mistakes"
            ],
            concerns: [
                "May need support adapting to fast-paced environment based on previous work experience"
            ]
        },
        highlights: [
            "Strong professionalism and maturity",
            "Good examples of teamwork and collaboration",
            "Self-aware and open to feedback"
        ],
        areasForImprovement: [
            "Practice STAR method for more consistent responses",
            "Include more specific metrics and outcomes",
            "Be more concise while maintaining detail"
        ]
    },

    // Key Strengths & Weaknesses (Overall)
    keyStrengths: [
        "Excellent communication skills - both technical and interpersonal",
        "Clean, readable code with good practices",
        "Strong problem-solving ability with guidance",
        "Professional demeanor and receptive to feedback",
        "Good team player with conflict resolution skills"
    ],
    keyWeaknesses: [
        "Could improve speed in recognizing optimal patterns",
        "Needs more practice with STAR method for behavioral questions",
        "Debugging could be more efficient",
        "Sometimes needs prompting for edge case consideration"
    ],

    // Development Recommendations
    recommendations: [
        {
            area: "Algorithm Pattern Recognition",
            suggestion: "Practice more LeetCode problems focusing on common patterns (sliding window, two pointers, etc.) to improve initial approach selection",
            priority: 'high'
        },
        {
            area: "Behavioral Interview Skills",
            suggestion: "Prepare 5-6 core stories using STAR method that can be adapted to different behavioral questions",
            priority: 'high'
        },
        {
            area: "Debugging Efficiency",
            suggestion: "Practice debugging under time pressure and use systematic approaches (binary search, print debugging, etc.)",
            priority: 'medium'
        },
        {
            area: "System Design",
            suggestion: "Study scalability patterns and practice system design interviews for senior-level readiness",
            priority: 'low'
        }
    ],

    // Next Steps
    readyForRole: true,
    suggestedNextSteps: "Candidate is ready for mid-level software engineering roles. Recommend moving forward to final round. Suggest they practice more algorithm patterns and STAR method before final interview.",
    additionalComments: "Overall strong candidate with good fundamentals. With some focused practice on identified areas, could be an excellent fit for the team."
};

const agent = createCoordinatorAgent({
    getSession: () => null,
    setPendingEnd: (value) => {
        pendingEnd = value;
    },
});

const sort = (e: Message[]) => {
    return e.sort((a, b) => a.created - b.created);
}

export default function Dashboard() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionRef = useRef<RealtimeSession | null>(null);

    const [displayGradual, setDisplayGradual] = useState<null | string>(null)
    const [messages, setMessages] = useState<Message[]>([]);
    const [started, setStarted] = useState(false);
    const [agentStatus, setAgentStatus] = useState<AgentStatus>({
        name: "", current_tool_name: ""
    })
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [userAudioStream, setUserAudioStream] =
        useState<MediaStream | null>(null);
    const [code, setCode] = useState<string>('');
    const codeRef = useRef<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>({ language: 'javascript', version: '1.32.3' })
    const [currentToolbarOption, setCurrentToolbarOption] = useState<'whiteboard' | 'editor'>('whiteboard')
    const [question, setQuestion] = useState<any>({});
    const [testCalls, setTestCalls] = useState<string>('');
    const [problemAttempt, setProblemAttempt] = useState<ProblemAttempt | null>(null);
    const [hint, setHint] = useState<Hint | null>(null)
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [codeExecutionResponse, setCodeExecutionResponse] = useState<{ stdout: string, stderr: string, failedCase: number | null } | null>(null)
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
    const messagesRef = useRef<Message[]>(messages)
    const questionRef = useRef<any>(question)
    const problemAttemptRef = useRef<ProblemAttempt | null>(null)

    useEffect(() => {
        return () => {
            if (sessionRef.current) {
                sessionRef.current.close()
            }
        }
    }, [])

    useEffect(() => {
        questionRef.current = question;
    }, [question])

    useEffect(() => {
        problemAttemptRef.current = problemAttempt;
    }, [problemAttempt])

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages])

    useEffect(() => {
        codeRef.current = code;
    }, [code])

    const updateAgentStatus = (key: keyof AgentStatus, value: string) => {
        setAgentStatus((prev) => ({ ...prev, [key]: value }))
    }

    const handleEndCall = async () => {
        pendingEnd = false;
        setCode("")
        setTestCalls('')
        setProblemAttempt(null)
        setQuestion({})
        setAgentStatus({ name: "", current_tool_name: "" })
        setMessages([])
        setStarted(false)
        setAudioStream(null)
        setUserAudioStream(null)
    }

    const startAgent = useCallback(async () => {
        if (started) return;
        setStarted(true);

        const audio = document.createElement("audio");
        audio.autoplay = true;
        audioRef.current = audio;

        audio.addEventListener("playing", () => {
            const stream =
                (audio as any).captureStream?.() ||
                (audio as any).mozCaptureStream?.();

            if (!stream) {
                console.error("captureStream not supported");
                return;
            }

            setAudioStream(stream);
        });

        const userStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
        });

        const transport = new OpenAIRealtimeWebRTC({
            mediaStream: userStream,
            audioElement: audio,
        });

        setUserAudioStream(userStream)

        const session = new RealtimeSession(agent, {
            model: "gpt-4o-realtime",
            transport,
        });

        pendingEnd = false;
        sessionRef.current = session;
        session.currentAgent.handoffs.forEach((_subagent) => {
            if (_subagent instanceof Agent) {
                const currInstruction = _subagent.instructions
                _subagent.instructions = () => {
                    const user = sessionStorage.getItem('user') || ''
                    return `${currInstruction} The candidates resume: ${user}`;
                }
            }
        })

        const res = await axios.get("http://localhost:3000/session-auth/token");
        await session.connect({ apiKey: res.data.key });
        session.sendMessage("Do not mention this message. Start the conversation with the candidate.")

        session.on('agent_start', (_context, _agent) => {
            updateAgentStatus('name', _agent.name)
        })

        session.on('agent_tool_start', async (_context, _agent, _tool) => {
            updateAgentStatus('current_tool_name', _tool.name)
            if (_tool.name == 'get_user_code') {
                const split = codeRef.current.split('\n')
                const newArr = split.map((line, i) => ({ content: line, lineNumber: i + 1 }))
                session.sendMessage(`DO NOT MENTION THIS MESSAGE. The user's code is: ${JSON.stringify(newArr)}. If they need a hint or suggestion analyze the code and then call the provide_hint (hint/suggestions) function which takes in the start and end line of the fix and the new code.`)
            } else if (_tool.name == 'get_feedback') {
                const msgs = messagesRef.current
                const finalCode = codeRef.current
                const q = questionRef.current
                const subs = problemAttemptRef.current
                const feedbackRes = await axios.post('http://localhost:3000/interview/feedback', {
                    messages: msgs,
                    finalCode: finalCode,
                    question: q,
                    submissions: subs,
                })
                const { feedback } = feedbackRes.data
                setFeedback(feedback)
                session.sendMessage(`DO NOT MENTION THIS MESSAGE. Give the user a detailed summary of the following feedback created: ${JSON.stringify(feedback)}. DO NOT READ THE ENTIRE THING! A summary is all this is need they will be shown it after the interview is over.`)
            }
        })

        session.on('agent_tool_end', (_context, _agent, _tool, r) => {
            let res;
            try {
                res = JSON.parse(r);
            } catch (_) {
                console.log(_tool.name, r)
                res = r;
            }

            switch (_tool.name) {
                case 'provide_hint':
                    const { start, end, code } = res;
                    setHint({ start, end, code })
                    break;
                case 'get_question':
                    const def = res.question[1][selectedLanguage.language];
                    setCode(def.functionDeclaration);
                    setTestCalls(def.compareHelper + '\n' + def.testCalls.join("\n"))
                    setQuestion(res.question[1])

                    const newProblemAttempt: ProblemAttempt = {
                        startedAt: Date.now(),
                        problemId: 1,
                        submissions: [],
                        language: selectedLanguage.language,
                        version: selectedLanguage.version
                    }
                    setProblemAttempt(newProblemAttempt)
                    break;
                case 'get_language':
                    try {
                        setSelectedLanguage(res);
                    } catch (_) {
                        setSelectedLanguage((r as unknown) as Language)
                    }
                    break;
                default:
                    break;
            }
        })

        session.on('transport_event', (e) => {
            if (e.type === 'output_audio_buffer.stopped' && pendingEnd) {
                const userConfirmed = window.confirm("Do you want to end the call?");

                if (userConfirmed) {
                    session.close();
                    handleEndCall();
                } else {
                    session.mute(false);
                    session.sendMessage("Do not mention this message. The user does not want to end the interview yet.");
                    pendingEnd = false;
                }
                return
            }

            const newMessage = eventToMessage(e)
            if (newMessage === null) return
            setMessages((prev) => prev.find((el) => el.event_id == newMessage.event_id) ? sort(prev) : sort([...prev, newMessage]))
            if (newMessage.role === 'agent' && !displayGradual) {
                setDisplayGradual(newMessage.content)
            }

            return;
        })

    }, [started]);

    const executeCode = async () => {
        const p = problemAttempt
        if (p == null) return;
        try {

            const res = await axios.post('https://emkc.org/api/v2/piston/execute', {
                language: selectedLanguage.language,
                version: selectedLanguage.version,
                files: [
                    {
                        content: code + testCalls
                    }
                ]
            })

            const { stdout, stderr } = res.data.run
            const newSubmission: Submission = {
                submittedAt: Date.now(),
                userCode: code,
                stdout,
                stderr
            }

            const errorMsg = newSubmission.stderr.toLowerCase()
            let i = errorMsg.indexOf('test case')
            if (i == -1) {
                setCodeExecutionResponse({
                    stdout: stdout,
                    stderr: stderr,
                    failedCase: null
                })
            } else {
                const k = errorMsg.substring(i);
                setCodeExecutionResponse({
                    stdout: stdout,
                    stderr: stderr,
                    failedCase: parseInt(k.split(" ")[2]) || null
                })
            }
            p.submissions.push(newSubmission)
            setProblemAttempt(p)

            sessionRef.current?.sendMessage(`This is a message from the system,
                 do not acknowledge you have recieved it. The results of the user's 
                 code submission was ${JSON.stringify({ stdout, stderr, code })}.
                 `)
        } catch (err) {
            console.error(err);
        }
    }

    return (
        (agentStatus.name === '' && feedback) ? <DisplayFeedback feedback={feedback} /> :
            (!started && !audioStream && !userAudioStream) ? <Card className="mx-auto my-12 flex flex-row h-5/6 w-5/6 border border-white/5
        rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)]
        bg-[#181818]">
                <StartInterview startAgent={startAgent} />
            </Card> :
                agentStatus.name !== 'Problem Interviewer' ? <div className="flex flex-row h-full w-full">
                    <div className="flex flex-col items-center justify-between h-full w-full py-6">
                        <div className="flex flex-row w-full items-center justify-center relative">
                            <AudioWave
                                stream={audioStream}
                                agent
                                isLoaded={isLoaded}
                                setIsLoaded={setIsLoaded}
                            />
                        </div>
                        {displayGradual && <GradualSpacing text={displayGradual} setDisplayGradual={setDisplayGradual} />}
                        <AudioWave
                            stream={userAudioStream}
                            agent={false}
                            isLoaded={isLoaded}
                            setIsLoaded={setIsLoaded}
                        />
                    </div>
                </div> :
                    <div className="flex flex-row h-screen w-full overflow-hiddenn">
                        <div className="flex flex-col w-xs gap-2">
                            <div className="flex flex-col flex-1 min-h-0 gap-2">
                                <AudioWave
                                    stream={audioStream}
                                    agent
                                    isLoaded={isLoaded}
                                    setIsLoaded={setIsLoaded}
                                    current_agent={agentStatus.name}
                                />
                                <AudioWave
                                    stream={userAudioStream}
                                    agent={false}
                                    isLoaded={isLoaded}
                                    setIsLoaded={setIsLoaded}
                                    current_agent={agentStatus.name}
                                />

                                {question?.content && <Button className="bg-white text-black font-btn-font">
                                    Problem Statement
                                </Button>}

                                {question?.content && (
                                    <div className="px-2">
                                        <p className="max-h-[80%] text-white overflow-y-scroll font-nav-font max-w-full">
                                            {question.content}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="px-4 self-center relative mt-8">
                            {currentToolbarOption === 'whiteboard' ?
                                <Whiteboard session={sessionRef} height={600} width={1050} />
                                :
                                <div className="w-full h-full">
                                    <button className="border-2 w-fit px-2 bg-white text-black" onClick={executeCode}>Run Code</button>
                                    <Editor
                                        height={600}
                                        width={1050}
                                        language={selectedLanguage.language}
                                        theme='light'
                                        value={code}
                                        onChange={(e) => setCode(e || '')}
                                    />
                                    <Card className="px-4 py-2 h-48 w-full bg-[#181818] rounded-none">
                                        <h3 className="font-label-font text-gray-200 font-bold text-2xl">Test Cases</h3>
                                        {codeExecutionResponse && <div className="flex flex-col px-2 text-white">
                                            <p className="font-nav-font line-clamp-2">Stdout: {codeExecutionResponse.stdout}</p>
                                            <p className="font-nav-font line-clamp-2">Stderr: {codeExecutionResponse.stderr}</p>
                                            <p className="font-nav-font line-clamp-2">Failed Case: {codeExecutionResponse.failedCase}</p>
                                        </div>}
                                    </Card>
                                </div>
                            }
                        </div>
                        <div className="flex flex-row w-fit ml-auto relative">
                            {(isLoaded) && (
                                <div className="absolute right-8">
                                    <ToolBar setCurrentToolbarOption={setCurrentToolbarOption} />
                                </div>
                            )}
                        </div>
                    </div >
    );
}