import { createCoordinatorAgent } from "@/agents/orchestrator";
import { OpenAIRealtimeWebRTC } from "@openai/agents/realtime";
import { RealtimeSession } from "@openai/agents/realtime";

import { useRef, useState, useCallback, useEffect, type Dispatch, type SetStateAction } from "react";
import axios from "axios";
import StartInterview from "./startInterview";
import { Card } from "./ui/card";
import { useStopwatch } from 'react-timer-hook';
import { motion } from "motion/react";
import type { Message } from "@/types/message";
import Whiteboard from "./whiteboard";
import { eventToMessage } from "@/utils/sessionEvents";
import { ConversationIcon } from "./icons/conversation";
import { WhiteboardIcon } from "./icons/whiteboard";
import { CodeEditorIcon } from "./icons/codeEditor";
import ToolBar from "./dashboard/toolbar";
import { AudioWave } from "./dashboard/audioWave";
import GradualSpacing from "./dashboard/agentText";
import type { AgentStatus } from "@/types/agentStatus";
import { Agent } from "@openai/agents";
import type { Language } from "@/types/language";
import type { ProblemAttempt } from "@/types/problem";
import type { Hint } from "@/types/hint";

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

export default function Dash() {
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
    const [question, setQuestion] = useState<any>({});
    const [testCalls, setTestCalls] = useState<string>('');
    const [problemAttempt, setProblemAttempt] = useState<ProblemAttempt | null>(null);
    const [hint, setHint] = useState<Hint | null>(null)

    useEffect(() => {
        codeRef.current = code;
    }, [code])

    const updateAgentStatus = (key: keyof AgentStatus, value: string) => {
        setAgentStatus((prev) => ({ ...prev, [key]: value }))
    }

    const handleEndCall = () => {
        pendingEnd = false;
        setCode("")
        setTestCalls('')
        setProblemAttempt(null)
        setQuestion({})
        setAgentStatus({ name: "", current_tool_name: "" })
        setMessages([])
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

        session.on('agent_tool_start', (_context, _agent, _tool) => {
            updateAgentStatus('current_tool_name', _tool.name)
            if (_tool.name == 'get_user_code') {
                const split = codeRef.current.split('\n')
                const newArr = split.map((line, i) => ({ content: line, lineNumber: i + 1 }))
                session.sendMessage(`DO NOT MENTION THIS MESSAGE. The user's code is: ${JSON.stringify(newArr)}. If they need a hint or suggestion analyze the code and then call the provide_hint (hint/suggestions) function which takes in the start and end line of the fix and the new code.`)
            }
        })

        session.on('agent_tool_end', (_context, _agent, _tool, r, d) => {
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

    const [isLoaded, setIsLoaded] = useState<boolean>(false);

    return (
        (!started && !audioStream && !userAudioStream) ? <Card className="mx-auto my-12 flex flex-row h-5/6 w-5/6 border border-white/5
        rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)]
        bg-[#181818]">
            <StartInterview startAgent={startAgent} />
        </Card> :
            <div className="flex flex-row h-full w-full">
                <div className="flex flex-col border-2 items-center justify-between h-full w-full py-6">
                    <div className="flex flex-row w-full items-center justify-center relative">
                        <AudioWave
                            stream={audioStream}
                            agent
                            isLoaded={isLoaded}
                            setIsLoaded={setIsLoaded}
                        />
                        {(isLoaded && agentStatus.name === 'Problem Interviewer') && (
                            <div className="absolute right-8">
                                <ToolBar />
                            </div>
                        )}
                    </div>

                    {(agentStatus.name === 'Coordinator' || agentStatus.name === 'Behavioral Interviewer') ?
                        (displayGradual && <GradualSpacing text={displayGradual} setDisplayGradual={setDisplayGradual} />)
                        :
                        (agentStatus.name === 'Problem Interviewer' && <Whiteboard session={sessionRef} height={500} width={500} />)
                    }

                    <AudioWave
                        stream={userAudioStream}
                        agent={false}
                        isLoaded={isLoaded}
                        setIsLoaded={setIsLoaded}
                    />
                </div>
            </div>
    );
}