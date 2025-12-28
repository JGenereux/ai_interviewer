import { RealtimeSession } from '@openai/agents/realtime';
import { useEffect, useRef, useState } from "react"
import Editor from "@monaco-editor/react";
import axios from 'axios'
import { Agent } from '@openai/agents';
import { createCoordinatorAgent } from '../agents/orchestrator';
import type { ProblemAttempt, Submission } from '../types/problem';
import type { Language } from '../types/language';
import type { AgentStatus } from '../types/agentStatus';
import type { Message } from '../types/message';
import { Card } from './ui/card';
import StartInterview from './startInterview';
import type { Hint } from '@/types/hint';
import { OpenAIRealtimeWebRTC } from "@openai/agents/realtime";



let sessionRef: RealtimeSession | null = null;
let pendingEnd = false;

const agent = createCoordinatorAgent({
    getSession: () => sessionRef,
    setPendingEnd: (value) => { pendingEnd = value; }
});

const minEvents = new Set(['conversation.item.input_audio_transcription.completed',
    'response.output_audio_transcript.done'])

const audioElement = document.createElement('audio');
audioElement.autoplay = true; // Ensure autoplay is enabled

const transport = new OpenAIRealtimeWebRTC({
    mediaStream: await navigator.mediaDevices.getUserMedia({ audio: true }), // User mic stream
    audioElement: audioElement, // The element where agent audio will play
});

const session = new RealtimeSession(agent, {
    model: 'gpt-4o-realtime',
    transport
})

export default function Dashboard() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [agentRunning, setAgentRunning] = useState<boolean>(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [agentStatus, setAgentStatus] = useState<AgentStatus>({
        name: "", current_tool_name: ""
    })
    const [code, setCode] = useState<string>('');
    const codeRef = useRef<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>({ language: 'javascript', version: '1.32.3' })
    const [solving, setSolving] = useState<boolean>(false);
    const solvingRef = useRef<boolean>(false);
    const [question, setQuestion] = useState<any>({});
    const [testCalls, setTestCalls] = useState<string>('');
    const [problemAttempt, setProblemAttempt] = useState<ProblemAttempt | null>(null);
    const [interviewStarted, setInterviewStarted] = useState<boolean>(false);
    const [hint, setHint] = useState<Hint | null>(null)


    useEffect(() => {
        codeRef.current = code;
    }, [code])

    useEffect(() => {
        solvingRef.current = solving;
    }, [solving])

    const updateAgentStatus = (key: keyof AgentStatus, value: string) => {
        setAgentStatus((prev) => ({ ...prev, [key]: value }))
    }

    // Swaps adjacent user & agent messages in case of event/state issues.
    const sort = (e: Message[]) => {
        return e.sort((a, b) => a.created - b.created);
    }

    const handleOnClose = () => {
        setAgentRunning(false);
        pendingEnd = false;
        setCode("")
        setTestCalls('')
        setProblemAttempt(null)
        setQuestion({})
        setSolving(false)
        setMessages([])
    }

    const start = async () => {
        try {
            if (!session) return;
            const res = await axios.get('http://localhost:3000/session-auth/token');

            // Reset state for new session
            pendingEnd = false;
            sessionRef = session;
            session.currentAgent.handoffs.forEach((_subagent) => {
                if (_subagent instanceof Agent) {
                    const currInstruction = _subagent.instructions
                    _subagent.instructions = () => {
                        const user = sessionStorage.getItem('user') || ''
                        return `${currInstruction} The candidates resume: ${user}`;
                    }
                }
            })

            await session.connect({ apiKey: res.data.key });
            sessionRef?.sendMessage("Do not mention this message. Start the conversation with the candidate.")
            setAgentRunning(true);

            session.on('agent_start', (_, agent) => {
                updateAgentStatus('name', agent.name)
                if (agent.name == 'Problem Interviewer') {
                    setSolving(true);
                } else if (solvingRef.current) {
                    setSolving(false);
                }
            })

            session.on('agent_tool_start', (_context, _agent, _tool) => {
                if (_tool.name == 'get_user_code') {
                    const split = codeRef.current.split('\n')
                    const newArr = split.map((line, i) => ({ content: line, lineNumber: i + 1 }))
                    session.sendMessage(`DO NOT MENTION THIS MESSAGE. The user's code is: ${JSON.stringify(newArr)}. If they need a hint or suggestion analyze the code and then call the provide_hint (hint/suggestions) function which takes in the start and end line of the fix and the new code.`)
                }
            })

            session.on('agent_tool_end', (_context, _agent, _tool, r, d) => {
                if (_tool.name === 'provide_hint') {
                    const res = JSON.parse(r)
                    const { start, end, code } = res;
                    console.log(start, end, code)
                    setHint({ start, end, code })
                    return
                }
                if (_tool.name === 'get_question') {
                    const res = JSON.parse(r)
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
                } else if (_tool.name === 'get_language') {
                    try {
                        if (typeof r !== 'string') throw ("invalid")
                        JSON.parse(r);
                        setSelectedLanguage(JSON.parse(r));
                    } catch (_) {
                        setSelectedLanguage((r as unknown) as Language)
                    }
                }
            })

            session.on('transport_event', (e) => {
                // Handle message transcripts
                if (minEvents.has(e.type)) {
                    const role = e.type.split('.')[0] == 'conversation' ? 'user' : 'agent'
                    const newMessage = {
                        role, content: e.transcript, id: e.item_id, event_id: e.event_id, created: Date.now()
                    }
                    setMessages((prev) => prev.find((el) => el.event_id == e.event_id) ? sort(prev) : sort([...prev, newMessage]))
                }

                // Handle end interview after agent finishes speaking
                if (e.type === 'output_audio_buffer.stopped' && pendingEnd) {
                    const userConfirmed = window.confirm("Do you want to end the call?");

                    if (userConfirmed) {
                        session.close();
                        handleOnClose();
                    } else {
                        // User doesn't want to end - unmute and let agent know
                        session.mute(false);
                        session.sendMessage("Do not mention this message. The user does not want to end the interview yet.");
                        pendingEnd = false;
                    }
                }
            })
        } catch (err) {
            console.error(err);
            alert(err);
        }
    };

    const end = () => {
        try {
            session.close();
            handleOnClose();
        } catch (err) {
            console.error(err);
            alert(err);
        }

        setAgentRunning(false);
    }

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

            p.submissions.push(newSubmission)
            setProblemAttempt(p)

            session.sendMessage(`This is a message from the system,
                 do not acknowledge you have recieved it. The results of the user's 
                 code submission was ${JSON.stringify({ stdout, stderr, code })}.
                 `)
        } catch (err) {
            console.error(err);
        }
    }

    return <Card className="mx-auto my-12 flex flex-row h-5/6 w-5/6 border border-white/5
            rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)]
            bg-[#181818]">

        {!interviewStarted && <StartInterview setStartInterview={setInterviewStarted} />}
        {interviewStarted && <> <div className="relative flex flex-col w-1/2 border-r-2 border-red-500 h-full py-4">
            <Conversation messages={messages} solving={solving} />
            {solving && <Question question={question} />}
            {hint && <DisplayHint start={hint.start} end={hint.end} code={hint.code} />}
        </div>
            <div className="flex flex-col gap-4 w-1/2 h-full py-2 px-1.5">
                <div className="flex flex-row w-full items-center justify-end gap-4">
                    <button className="border-2 p-1 cursor-pointer" onClick={start}>Talk to agent</button>
                    <button className="border-2 p-1 cursor-pointer" onClick={end}>Stop talking to agent</button>
                </div>
                <span className="self-center">{agentRunning ? 'Call is currently active' : 'Start a call!'}</span>
                <div className="flex flex-col self-center items-center w-full h-full">
                    {agentStatus.name && <span>Name: {agentStatus.name}</span>}
                    {agentStatus.current_tool_name && <span>Current Tool: {agentStatus.current_tool_name}</span>}
                    <div className="flex flex-col gap-2 h-full w-full">
                        <button className="border-2 w-fit px-2" onClick={executeCode}>Run Code</button>
                        <Editor
                            height="90%"
                            width="100%"
                            language={selectedLanguage.language}
                            theme="vs-dark"
                            value={code}
                            onChange={(e) => setCode(e || '')}
                        />
                    </div>
                </div>
            </div> </>}
    </Card>
}

function DisplayHint({ start, end, code }: Hint) {
    return <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        className="border-white text-black absolute z-50">
        <span>Start: {start}</span>
        <span>End: {end}</span>
        <span>Code: {code}</span>
    </div>
}

function Question({ question }: { question: any }) {
    return <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
        className="z-30 h-[90%] w-[90%] bg-black text-white px-2 py-1">
        <p>{question.content}</p>
    </div>
}

function Conversation({ messages, solving }: { messages: Message[], solving: boolean }) {
    return <div style={{ filter: solving ? 'blur(2px)' : 'blur(0px)' }} className="flex gap-4 flex-col max-h-4/5 border-black overflow-y-scroll">
        {messages?.map((el) => {
            return <DisplayMessage key={el.id} message={el} />
        })}
    </div>
}

function DisplayMessage({ message }: { message: Message }) {
    const isUser = message.role === 'user'
    return <div className="flex h-fit pl-0.5 pt-0.5">
        <div style={{ marginLeft: isUser ? 'auto' : '0px', backgroundColor: isUser ? '#1E88E5' : '#aaaaaa' }}
            className="w-3/5 text-white font-bold px-2 py-2">
            <p>{message.content}</p>
        </div>
    </div>
}