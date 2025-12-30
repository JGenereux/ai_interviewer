import { createCoordinatorAgent } from "@/agents/orchestrator";
import { OpenAIRealtimeWebRTC } from "@openai/agents/realtime";
import { RealtimeSession } from "@openai/agents/realtime";

import { useRef, useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
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
import { motion, AnimatePresence } from 'motion/react'

let pendingEnd = false;

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
    const [pendingSwitch, setPendingSwitch] = useState<'whiteboard' | 'editor' | null>(null)
    const [editorLoaded, setEditorLoaded] = useState(false)
    const toolbarIntervalRef = useRef<NodeJS.Timeout | null>(null)
    const editorRef = useRef<any>(null)
    const decorationsRef = useRef<string[]>([])
    const [question, setQuestion] = useState<any | null>(null);
    const [testCalls, setTestCalls] = useState<string>('');
    const [problemAttempt, setProblemAttempt] = useState<ProblemAttempt | null>(null);
    const [hint, setHint] = useState<Hint | null>(null)
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [codeExecutionResponse, setCodeExecutionResponse] = useState<{ stdout: string, stderr: string, failedCase: number | null } | null>(null)
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
    const messagesRef = useRef<Message[]>(messages)
    const questionRef = useRef<any>(question)
    const problemAttemptRef = useRef<ProblemAttempt | null>(null)
    const [selectedCase, setSelectedCase] = useState<any>(null)
    const [viewQuestion, setViewQuestion] = useState<boolean>(false)

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

    useEffect(() => {
        if (editorLoaded && pendingSwitch === 'editor') {
            setCurrentToolbarOption('editor')
            setPendingSwitch(null)
        }
    }, [editorLoaded, pendingSwitch])

    useEffect(() => {
        if (agentStatus.name !== 'Problem Interviewer') return
        if (toolbarIntervalRef.current) {
            clearInterval(toolbarIntervalRef.current)
        }

        const onToolbarTick = () => {
            if (!sessionRef.current) return
            switch (currentToolbarOption) {
                case 'editor':
                    const split = codeRef.current.split('\n')
                    const newArr = split.map((line, i) => ({ content: line, lineNumber: i + 1 }))
                    sessionRef.current.sendMessage(`PINGED MESSAGE! DO NOT MENTION THIS MESSAGE. The user's code is: ${JSON.stringify(newArr)}. If they have been stuck for a while (i.e haven't written anything, solution hasn't changed in mins) or look lost then ask them.`)
                    break;
                case 'whiteboard':
                    break;
            }
        }

        toolbarIntervalRef.current = setInterval(onToolbarTick, 15000)

        return () => {
            if (toolbarIntervalRef.current) {
                clearInterval(toolbarIntervalRef.current)
            }
        }
    }, [currentToolbarOption])

    useEffect(() => {
        if (!editorRef.current || !hint) {
            if (editorRef.current && decorationsRef.current.length > 0) {
                decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [])
            }
            return
        }

        const monaco = (window as any).monaco
        if (!monaco) return

        decorationsRef.current = editorRef.current.deltaDecorations(
            decorationsRef.current,
            [{
                range: new monaco.Range(hint.start, 1, hint.end, 1),
                options: {
                    isWholeLine: true,
                    className: 'hint-line-highlight'
                }
            }]
        )

        return () => {
            if (editorRef.current) {
                editorRef.current.deltaDecorations(decorationsRef.current, [])
            }
        }
    }, [hint])

    const requestToolbarSwitch = (target: 'whiteboard' | 'editor') => {
        if (target === currentToolbarOption) return
        if (target === 'editor' && !editorLoaded) {
            setPendingSwitch('editor')
        } else {
            setCurrentToolbarOption(target)
        }
    }

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
                setProblemAttempt((p) => p === null ? null : { ...p, feedback })
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
                    if (def?.typeDefs && def.typeDefs.length > 0) {
                        setCode(def.typeDefs + "\n" + def.functionDeclaration);
                    } else {
                        setCode(def.functionDeclaration);
                    }
                    setTestCalls(def.builders + "\n" + def.compareHelper + '\n' + def.testCalls.join("\n"))
                    setQuestion(res.question[1])
                    setSelectedCase(res.question[1].displayCases[0])

                    const newProblemAttempt: ProblemAttempt = {
                        startedAt: Date.now(),
                        problemId: 1,
                        submissions: [],
                        language: selectedLanguage.language,
                        version: selectedLanguage.version,
                        feedback: null
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
                        content: code + "\n" + testCalls
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
                    <div className="flex flex-row w-full h-full relative">
                        <div className="flex flex-col h-5/6 w-xs py-4 gap-2 px-4">
                            <AnimatePresence>
                                {viewQuestion && <ViewQuestion key="view-question" question={question} setViewQuestion={setViewQuestion} />}
                            </AnimatePresence>
                            <Button onClick={() => setViewQuestion(true)} className="focus:bg-white cursor-pointer w-fit bg-white text-black font-btn-font">
                                View Problem
                            </Button>

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
                        </div>
                        <div className="px-4 relative mt-16 overflow-hidden" style={{ width: 1050, height: 850 }}>
                            <motion.div
                                animate={{
                                    x: currentToolbarOption === 'whiteboard' ? 0 : '-100%',
                                    pointerEvents: currentToolbarOption === 'whiteboard' ? 'auto' : 'none'
                                }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                                className="absolute inset-0"
                            >
                                <Whiteboard session={sessionRef} height={600} width={1050} currentToolbarOption={currentToolbarOption} agentName={agentStatus.name} />
                            </motion.div>

                            <motion.div
                                animate={{
                                    x: currentToolbarOption === 'editor' ? 0 : '100%',
                                    pointerEvents: currentToolbarOption === 'editor' ? 'auto' : 'none'
                                }}
                                transition={{ duration: 0.6, ease: 'easeInOut' }}
                                className="absolute inset-0"
                            >
                                <div className="w-full h-full">
                                    <button className="border-2 w-fit px-2 bg-white text-black" onClick={executeCode}>Run Code</button>
                                    <div className="relative">
                                        <Editor
                                            height={600}
                                            width={1050}
                                            language={selectedLanguage.language}
                                            theme='light'
                                            value={code}
                                            onChange={(e) => setCode(e || '')}
                                            onMount={(editor) => {
                                                setEditorLoaded(true)
                                                editorRef.current = editor
                                            }}
                                        />
                                        <AnimatePresence>
                                            {hint && (
                                                <HintCard
                                                    key="hint-card"
                                                    hint={hint}
                                                    editorRef={editorRef}
                                                    onDismiss={() => setHint(null)}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    <AnimatePresence>
                                        {currentToolbarOption === 'editor' && (
                                            <motion.div
                                                key="test-cases"
                                                initial={{ y: 50, opacity: 0 }}
                                                animate={{ y: 0, opacity: 1 }}
                                                exit={{ y: 50, opacity: 0 }}
                                                transition={{ duration: 0.4, delay: 0.3 }}
                                            >
                                                <Card className="flex flex-col gap-4 px-4 py-4 h-48 w-full bg-[#181818] rounded-none">
                                                    <div className="flex flex-row gap-4">
                                                        {(question) && question.displayCases?.map((testCase: any, i: number) => {
                                                            return <Button onClick={() => setSelectedCase(testCase)} className="bg-white text-black hover:bg-white" key={i}>Test Case {i + 1}</Button>
                                                        })}
                                                    </div>
                                                    {selectedCase && <div className="flex flex-col">
                                                        <span className="text-gray-300">Inputs</span>
                                                        <div className="flex flex-row">
                                                            {Object.entries(selectedCase.inputs).map((k) =>
                                                                <p className="text-white">{k[0]}={k[1] as string}</p>
                                                            )}
                                                        </div>

                                                        <span className="text-gray-300">Expected Result</span>
                                                        <span className="text-white">{selectedCase.expected}</span>
                                                    </div>}
                                                </Card>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        </div>
                        <div className="flex flex-row w-fit ml-auto relative">
                            {(isLoaded) && (
                                <div className="absolute right-8">
                                    <ToolBar requestToolbarSwitch={requestToolbarSwitch} />
                                </div>
                            )}
                        </div>
                    </div >
    );
}

function ViewQuestion({ question, setViewQuestion }: { question: any, setViewQuestion: Dispatch<SetStateAction<boolean>> }) {
    const testCases = question.displayCases;
    return <motion.div initial={{ width: 0, fontSize: 0 }} exit={{ width: 0 }} animate={{ width: '40%', fontSize: '14px' }} transition={{ duration: 0.6 }} className="bg-[#181818] h-full z-50 absolute top-0 left-0 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.8)]">
        <motion.div exit={{ opacity: 0, fontSize: 0 }} transition={{ duration: 0.4 }} className="flex flex-col py-2 px-4 gap-4">
            <motion.button exit={{ width: 0, fontSize: 0, height: 0, backgroundColor: 'transparent' }} transition={{ duration: 0.6 }} onClick={() => setViewQuestion(false)} className="focus:bg-white px-4 py-1 rounded-full cursor-pointer ml-auto w-fit bg-white text-black font-btn-font">
                Close Menu
            </motion.button>
            <p className="font-nav-font text-white">{question.content}</p>
            {testCases?.map((testCase: any) => {
                return <div key={testCase.caseNumber}>
                    <span className="text-white font-bold font-label-font">Example {testCase.caseNumber}</span>
                    <div className="flex flex-row">
                        {Object.entries(testCase.inputs).map((k) =>
                            <p className="text-white">{k[0]}={k[1] as string}</p>
                        )}
                    </div>

                    <span className="text-gray-300">Expected Result={testCase.expected}</span>
                </div>
            })}
        </motion.div>
    </motion.div>
}

type HintCardProps = {
    hint: Hint
    editorRef: React.RefObject<any>
    onDismiss: () => void
}

function HintCard({ hint, editorRef, onDismiss }: HintCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [topPosition, setTopPosition] = useState(0)

    useEffect(() => {
        if (editorRef.current && hint) {
            const top = editorRef.current.getTopForLineNumber(hint.start)
            setTopPosition(top)
        }
    }, [hint, editorRef])

    const lines = hint.code.split('\n')
    const needsExpand = lines.length > 2
    const displayLines = expanded ? lines : lines.slice(0, 2)

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            style={{ top: topPosition }}
            className="absolute right-0 z-10 w-72"
        >
            <Card className="bg-[#1e1e1e] border border-yellow-500/50 p-3 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-yellow-400 font-btn-font text-sm">Hint</span>
                    <button
                        onClick={onDismiss}
                        className="text-gray-400 hover:text-white text-sm cursor-pointer"
                    >
                        ✕
                    </button>
                </div>
                <pre className="text-white font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                    {displayLines.join('\n')}
                </pre>
                {needsExpand && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-yellow-400 hover:text-yellow-300 text-xs mt-2 cursor-pointer"
                    >
                        {expanded ? '▲ Collapse' : '▼ Expand'}
                    </button>
                )}
            </Card>
        </motion.div>
    )
}