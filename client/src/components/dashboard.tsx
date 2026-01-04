import { createCoordinatorAgent, guardrails } from "@/agents/orchestrator";
import { OpenAIRealtimeWebRTC } from "@openai/agents/realtime";
import { RealtimeSession } from "@openai/agents/realtime";

import { useRef, useState, useCallback, useEffect } from "react";
import axios from "axios";
import dbClient from "@/utils/supabaseDB";
import StartInterview, { type InterviewMode } from "./startInterview";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import type { Message } from "@/types/message";
import Whiteboard, { captureWhiteboardImage } from "./whiteboard";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { eventToMessage } from "@/utils/sessionEvents";
import ToolBar from "./dashboard/toolbar";
import { AudioWave } from "./dashboard/audioWave";
import type { AgentStatus } from "@/types/agentStatus";
import { Agent } from "@openai/agents";
import type { Language } from "@/types/language";
import type { ProblemAttempt, Submission } from "@/types/problem";
import type { Hint } from "@/types/hint";
import { Editor } from "@monaco-editor/react";
import type { InterviewFeedback, Interview } from "@/types/interview";
import DisplayFeedback from "./dashboard/displayFeedback";
import EndInterviewModal from "./dashboard/endInterviewModal";
import InterpretingIndicator from "./dashboard/interpretingIndicator";
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from "@/contexts/authContext";

const API_URL = import.meta.env.VITE_API_URL
let pendingEnd = false;

const sort = (e: Message[]) => {
    return e.sort((a, b) => a.created - b.created);
}

export default function Dashboard() {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const sessionRef = useRef<RealtimeSession | null>(null);
    const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
    const { id: userId, updateXp, resume, fullName, setTokens } = useAuth();
    const navigate = useNavigate();
    const [, setStartError] = useState<string | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [started, setStarted] = useState(false);
    const [xpGained, setXpGained] = useState<number | null>(null);
    const [agentStatus, setAgentStatus] = useState<AgentStatus>({
        name: "", current_tool_name: ""
    })
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [userAudioStream, setUserAudioStream] =
        useState<MediaStream | null>(null);
    const [code, setCode] = useState<string>('');
    const codeRef = useRef<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<Language>({ language: 'javascript', version: '18.15.0' })
    const selectedLanguageRef = useRef<Language>(selectedLanguage)
    const [currentToolbarOption, setCurrentToolbarOption] = useState<'whiteboard' | 'editor'>('whiteboard')
    const [pendingSwitch, setPendingSwitch] = useState<'whiteboard' | 'editor' | null>(null)
    const [editorLoaded, setEditorLoaded] = useState(false)
    const editorRef = useRef<any>(null)
    const decorationsRef = useRef<string[]>([])
    const [question, setQuestion] = useState<any | null>(null);
    const [testCalls, setTestCalls] = useState<string>('');
    const [rawTestCalls, setRawTestCalls] = useState<string[]>([]);
    const [problemAttempt, setProblemAttempt] = useState<ProblemAttempt | null>(null);
    const [hint, setHint] = useState<Hint | null>(null)
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [codeExecutionResponse, setCodeExecutionResponse] = useState<{
        results: { index: number; stdout: string; stderr: string; passed: boolean }[];
        failedCases: number[];
    } | null>(null)
    const [feedback, setFeedback] = useState<InterviewFeedback | null>(null)
    const [interview, setInterview] = useState<Interview | null>(null)
    const interviewRef = useRef<Interview | null>(null)
    const messagesRef = useRef<Message[]>(messages)
    const questionRef = useRef<any>(question)
    const problemAttemptRef = useRef<ProblemAttempt | null>(null)
    const [selectedCase, setSelectedCase] = useState<any>(null)
    const [consoleExpanded, setConsoleExpanded] = useState(true)
    const [, setInterviewMode] = useState<InterviewMode>('full')
    const interviewModeRef = useRef<InterviewMode>('full')
    const [showEndModal, setShowEndModal] = useState(false)
    const [interpretingWhiteboard, setInterpretingWhiteboard] = useState(false)
    const authTokenRef = useRef<string | null>(null)

    useEffect(() => {
        const updateToken = async () => {
            const { data: { session } } = await dbClient.auth.getSession();
            authTokenRef.current = session?.access_token || null;
        };
        updateToken();

        const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (_, session) => {
            authTokenRef.current = session?.access_token || null;
        });

        return () => subscription.unsubscribe();
    }, []);

    const refetchUserTokens = useCallback(async () => {
        try {
            const { data: { session } } = await dbClient.auth.getSession();
            if (!session || !userId) return;

            const response = await axios.get(`${API_URL}/users/${userId}`, {
                headers: { Authorization: `Bearer ${session.access_token}` }
            });
            if (response.data.user?.tokens !== undefined) {
                setTokens(response.data.user.tokens);
            }
        } catch (error) {
            console.error('Failed to refetch tokens:', error);
        }
    }, [userId, setTokens]);

    const endInterviewSync = useCallback(() => {
        const currentInterview = interviewRef.current;
        const token = authTokenRef.current;
        if (!currentInterview?.id || !token) return;

        sessionStorage.setItem('interview_ended_background', 'true');

        fetch(`${API_URL}/interview/end`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ interviewId: currentInterview.id }),
            keepalive: true
        }).catch(() => { });
    }, []);

    useEffect(() => {
        if (sessionStorage.getItem('interview_ended_background') === 'true') {
            sessionStorage.removeItem('interview_ended_background');
            refetchUserTokens();
        }
    }, [refetchUserTokens]);

    useEffect(() => {
        return () => {
            if (interviewRef.current?.id) {
                endInterviewSync();
            }
            if (sessionRef.current) {
                sessionRef.current.close()
            }
        }
    }, [endInterviewSync])

    // Handle browser close/navigation
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (interviewRef.current?.id && started) {
                endInterviewSync();
                // Show confirmation dialog
                e.preventDefault();
                e.returnValue = 'Your interview session will be ended. Are you sure?';
                return e.returnValue;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && interviewRef.current?.id && started) {
                endInterviewSync();
            } else if (document.visibilityState === 'visible' && sessionStorage.getItem('interview_ended_background') === 'true') {
                sessionStorage.removeItem('interview_ended_background');
                refetchUserTokens();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [started, endInterviewSync, refetchUserTokens])

    useEffect(() => {
        questionRef.current = question;
    }, [question])

    useEffect(() => {
        problemAttemptRef.current = problemAttempt;
    }, [problemAttempt])

    useEffect(() => {
        interviewRef.current = interview;
    }, [interview])

    useEffect(() => {
        selectedLanguageRef.current = selectedLanguage;
    }, [selectedLanguage])

    useEffect(() => {
        messagesRef.current = messages;
        if (interview) {
            setInterview(prev => prev ? { ...prev, messages } : null);
        }
    }, [messages])

    useEffect(() => {
        codeRef.current = code;
        if (interview) {
            setInterview(prev => prev ? { ...prev, code } : null);
        }
    }, [code])

    useEffect(() => {
        if (editorLoaded && pendingSwitch === 'editor') {
            setCurrentToolbarOption('editor')
            setPendingSwitch(null)
        }
    }, [editorLoaded, pendingSwitch])

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

    const endInterview = async () => {
        const currentInterview = interviewRef.current;
        if (!currentInterview?.id) return;

        try {
            const { data: { session: authSession } } = await dbClient.auth.getSession();
            const response = await axios.post(`${API_URL}/interview/end`, {
                interviewId: currentInterview.id
            }, {
                headers: { Authorization: `Bearer ${authSession?.access_token}` }
            });
            if (response.data.newBalance !== undefined) {
                setTokens(response.data.newBalance);
            }
        } catch (error) {
            console.error('Failed to end interview:', error);
        }
    }

    const handleEndCall = async () => {
        await endInterview();
        sessionStorage.removeItem('interview_ended_background');

        pendingEnd = false;
        setShowEndModal(false);
        setCode("")
        setTestCalls('')
        setRawTestCalls([])
        setProblemAttempt(null)
        setInterview(null)
        setQuestion({})
        setAgentStatus({ name: "", current_tool_name: "" })
        setMessages([])
        setStarted(false)
        setAudioStream(null)
        setUserAudioStream(null)
    }

    const handleConfirmEnd = async () => {
        if (sessionRef.current) {
            sessionRef.current.close();
        }
        await handleEndCall();
    }

    const handleCancelEnd = () => {
        setShowEndModal(false);
        if (sessionRef.current) {
            sessionRef.current.mute(false);
            sessionRef.current.sendMessage("Do not mention this message. The user does not want to end the interview yet.");
        }
        pendingEnd = false;
    }

    const startAgent = useCallback(async (mode: InterviewMode, language?: string) => {
        if (started) return;
        if (!userId) {
            console.error('Cannot start interview: User not authenticated');
            return;
        }
        setStartError(null);

        try {
            const { data: { session: authSession } } = await dbClient.auth.getSession();
            const authHeaders = { headers: { Authorization: `Bearer ${authSession?.access_token}` } };

            const startResponse = await axios.post(`${API_URL}/interview/start`, {
                mode
            }, authHeaders);

            if (!startResponse.data.success) {
                setStartError(startResponse.data.error || 'Failed to start interview');
                return;
            }

            if (startResponse.data.newTokenBalance !== undefined) {
                setTokens(startResponse.data.newTokenBalance);
            }

            setStarted(true);
            setInterviewMode(mode);
            interviewModeRef.current = mode;

            if (language) {
                try {
                    const runtimeRes = await axios.get('https://emkc.org/api/v2/piston/runtimes');
                    const matchingLangs = runtimeRes.data.filter((l: any) => l.language === language);
                    if (matchingLangs.length > 0) {
                        const latestLang = matchingLangs.sort((a: any, b: any) => {
                            const aParts = a.version.split('.').map(Number);
                            const bParts = b.version.split('.').map(Number);
                            for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
                                const aVal = aParts[i] || 0;
                                const bVal = bParts[i] || 0;
                                if (bVal !== aVal) return bVal - aVal;
                            }
                            return 0;
                        })[0];
                        setSelectedLanguage({ language: latestLang.language, version: latestLang.version });
                    }
                } catch (e) {
                    console.error('Failed to fetch language version:', e);
                }
            }

            const agent = createCoordinatorAgent({
                getSession: () => sessionRef.current,
                setPendingEnd: (value) => {
                    pendingEnd = value;
                },
            }, mode, {
                getSelectedLanguage: () => selectedLanguageRef.current,
                captureWhiteboard: async () => {
                    if (!excalidrawAPIRef.current) {
                        throw new Error('Whiteboard not ready');
                    }
                    return captureWhiteboardImage(excalidrawAPIRef.current);
                },
                getCode: () => codeRef.current,
                getProblemDescription: () => questionRef.current?.content || '',
                setInterpreting: setInterpretingWhiteboard
            });

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
                outputGuardrails: guardrails,

            });

            pendingEnd = false;
            sessionRef.current = session;

            const newInterview: Interview = {
                id: startResponse.data.interviewId,
                userId: userId || '',
                createdAt: new Date(startResponse.data.createdAt),
                feedback: null,
                messages: [],
                code: '',
                problemAttemptIds: []
            };
            setInterview(newInterview);

            session.currentAgent.handoffs.forEach((_subagent) => {
                if (_subagent instanceof Agent) {
                    const currInstruction = _subagent.instructions
                    _subagent.instructions = () => {
                        const resumeText = resume ? JSON.stringify(resume) : 'No resume provided';
                        const firstName = fullName?.split(' ')[0] || 'Candidate';
                        let instructions = `${currInstruction}\n\nCandidate Name: ${firstName}\nCandidate Resume: ${resumeText}`;

                        if (language && _subagent.name === 'Problem Interviewer') {
                            instructions += `\n\nPre-selected Language: The candidate has already selected "${language}" as their programming language. The language is already configured - do NOT ask them to choose a language. Proceed directly to calling get_question to fetch a problem.`;
                        }

                        return instructions;
                    }
                }
            })

            const res = await axios.get(`${API_URL}/session-auth/token`);
            await session.connect({ apiKey: res.data.key });
            session.sendMessage("Do not mention this message. Start the conversation with the candidate.")

            session.on('agent_start', (_context, _agent) => {
                updateAgentStatus('name', _agent.name)
            })

            session.on('agent_tool_start', async (_context, _agent, _tool) => {
                updateAgentStatus('current_tool_name', _tool.name)
                if (_tool.name == 'get_feedback') {
                    const msgs = messagesRef.current
                    const finalCode = codeRef.current
                    const q = questionRef.current
                    const subs = problemAttemptRef.current
                    const { data: { session: authSession } } = await dbClient.auth.getSession();
                    const feedbackHeaders = { headers: { Authorization: `Bearer ${authSession?.access_token}` } };
                    const feedbackRes = await axios.post(`${API_URL}/interview/feedback`, {
                        messages: msgs,
                        finalCode: finalCode,
                        question: q,
                        submissions: subs,
                        mode: interviewModeRef.current,
                    }, feedbackHeaders)
                    const { feedback } = feedbackRes.data
                    setFeedback(feedback)

                    const updatedProblemAttempt = problemAttemptRef.current
                        ? { ...problemAttemptRef.current, feedback }
                        : null;
                    setProblemAttempt(updatedProblemAttempt)

                    const currentInterview = interviewRef.current;
                    if (currentInterview) {
                        const finalInterview = {
                            ...currentInterview,
                            feedback,
                            code: codeRef.current,
                            messages: messagesRef.current
                        };
                        setInterview(finalInterview);

                        const problemAttempts = updatedProblemAttempt ? [updatedProblemAttempt] : [];
                        const saveResponse = await axios.post(`${API_URL}/interview/save`, {
                            interview: finalInterview,
                            problemAttempts
                        }, feedbackHeaders);
                        if (saveResponse.data.newTokenBalance !== undefined) {
                            setTokens(saveResponse.data.newTokenBalance);
                        }
                    }

                    const gained = await updateXp(feedback)
                    setXpGained(gained)
                    session.sendMessage(`DO NOT MENTION THIS MESSAGE. Give the user a detailed summary of the following feedback created: ${JSON.stringify(feedback)}. DO NOT READ THE ENTIRE THING! A summary is all this is need they will be shown it after the interview is over.`)
                }
            })

            session.on('agent_tool_end', (_context, _agent, _tool, r) => {
                let res;
                try {
                    res = JSON.parse(r);
                } catch (_) {
                    res = r;
                }

                switch (_tool.name) {
                    case 'provide_hint':
                        const { start, end, code } = res;
                        setHint({ start, end, code })
                        break;
                    case 'get_question':
                        const def = res.question[selectedLanguage.language];
                        if (def?.typeDefs && def.typeDefs.length > 0) {
                            setCode(def.typeDefs + "\n" + def.functionDeclaration);
                        } else {
                            setCode(def.functionDeclaration);
                        }

                        let setupCode = '';
                        if (def?.builders && def.builders.length > 0) {
                            setupCode += def.builders;
                        }
                        if (def?.compareHelper && def.compareHelper.length > 0) {
                            setupCode += (setupCode ? "\n" : "") + def.compareHelper;
                        }
                        setTestCalls(setupCode);
                        setRawTestCalls(def.testCalls)
                        setQuestion(res.question)
                        setSelectedCase(res.question.displayCases[0])

                        const currentInterview = interviewRef.current;
                        const problemAttemptId = crypto.randomUUID();
                        const newProblemAttempt: ProblemAttempt = {
                            id: problemAttemptId,
                            interviewId: currentInterview?.id || '',
                            startedAt: Date.now(),
                            submissions: [],
                            language: selectedLanguage.language,
                            version: selectedLanguage.version,
                            feedback: null
                        }
                        setProblemAttempt(newProblemAttempt)

                        if (currentInterview) {
                            setInterview({
                                ...currentInterview,
                                problemAttemptIds: [...currentInterview.problemAttemptIds, problemAttemptId]
                            });
                        }
                        break;
                    default:
                        break;
                }
            })

            session.on('transport_event', (e) => {
                if (e.type === 'output_audio_buffer.stopped' && pendingEnd) {
                    setShowEndModal(true);
                    return
                }

                const newMessage = eventToMessage(e)
                if (newMessage === null) return
                setMessages((prev) => prev.find((el) => el.event_id == newMessage.event_id) ? sort(prev) : sort([...prev, newMessage]))

                return;
            })

        } catch (error: any) {
            if (error.response?.status === 402) {
                setStartError('Insufficient tokens to start an interview');
                navigate('/pricing');
            } else {
                setStartError(error.response?.data?.error || 'Failed to start interview');
            }
        }
    }, [started, userId, navigate]);

    const executeCode = async () => {
        const p = problemAttempt
        if (p == null) return;
        try {
            const { data: { session: authSession } } = await dbClient.auth.getSession();
            const setupCode = testCalls;
            const testCases = rawTestCalls.map(testCall => code + "\n" + setupCode + "\n" + testCall);

            const res = await axios.post(`${API_URL}/interview/execute`, {
                language: selectedLanguage.language,
                version: selectedLanguage.version,
                testCases
            }, {
                headers: { Authorization: `Bearer ${authSession?.access_token}` }
            });

            const results = res.data.results;
            const failedCases = results.filter((r: any) => !r.passed).map((r: any) => r.index);
            const allStdout = results.map((r: any) => r.stdout).filter(Boolean).join('\n');
            const allStderr = results.map((r: any) => r.stderr).filter(Boolean).join('\n');

            const newSubmission: Submission = {
                submittedAt: Date.now(),
                userCode: code,
                stdout: allStdout,
                stderr: allStderr
            }

            setCodeExecutionResponse({
                results,
                failedCases
            });

            p.submissions.push(newSubmission)
            setProblemAttempt(p)

            const summary = failedCases.length === 0
                ? 'All test cases passed!'
                : `Failed test cases: ${failedCases.join(', ')}`;

            sessionRef.current?.sendMessage(`This is a message from the system,
                 do not acknowledge you have recieved it. The results of the user's 
                 code submission: ${summary}. Details: ${JSON.stringify({ results, code })}.
                 `)
        } catch (err) {
            console.error(err);
        }
    }

    if (agentStatus.name === '' && feedback) {
        return <DisplayFeedback feedback={feedback} xpGained={xpGained} />;
    }

    if (!started && !audioStream && !userAudioStream) {
        return (
            <Card className="mx-auto my-12 flex flex-row h-5/6 w-5/6 border border-white/5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)] bg-[#181818]">
                <StartInterview startAgent={startAgent} />
            </Card>
        );
    }

    if (agentStatus.name !== 'Problem Interviewer') {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-60px)] w-full cyber-grid-bg">
                <div className="flex flex-col items-center gap-8 max-w-2xl">
                    <AudioWave
                        stream={audioStream}
                        agent
                        isLoaded={isLoaded}
                        setIsLoaded={setIsLoaded}
                    />
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

    return (
        <div className="grid grid-cols-[320px_1fr_280px] h-[calc(100vh-60px)] cyber-grid-bg overflow-hidden">
            {/* Left Panel - Problem Sidebar */}
            <div className="cyber-panel flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-(--cyber-cyan) font-header-font text-lg tracking-wide">
                            Problem
                        </span>
                        <span className="px-2 py-0.5 text-xs font-btn-font bg-(--cyber-amber)/20 text-(--cyber-amber) rounded">
                            {selectedLanguage.language.toUpperCase()}
                        </span>
                    </div>
                    <div className="cyber-divider" />
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 subtle-scrollbar">
                    {question ? (
                        <>
                            <div className="space-y-3">
                                <h3 className="text-white font-label-font text-sm font-semibold">Description</h3>
                                <p className="text-white/70 font-nav-font text-sm leading-relaxed">
                                    {question.content}
                                </p>
                            </div>

                            <div className="cyber-divider my-4" />

                            <div className="space-y-3">
                                <h3 className="text-white font-label-font text-sm font-semibold">Test Cases</h3>
                                <div className="flex flex-wrap gap-2">
                                    {question.displayCases?.map((testCase: any, i: number) => {
                                        const testResult = codeExecutionResponse?.results?.find(r => r.index === i + 1);
                                        const isPassed = testResult?.passed === true;
                                        const isFailed = testResult?.passed === false;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setSelectedCase(testCase)}
                                                className={`test-case-tab ${selectedCase === testCase ? 'active' : ''} ${isPassed ? 'passed' : ''} ${isFailed ? 'failed' : ''}`}
                                            >
                                                Case {i + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                {selectedCase && (
                                    <div className="console-output mt-3 space-y-2">
                                        <div>
                                            <span className="text-(--cyber-cyan) text-xs font-btn-font">INPUT</span>
                                            <div className="mt-1 text-white/80">
                                                {Object.entries(selectedCase.inputs).map(([key, value]) => (
                                                    <div key={key} className="font-nav-font">
                                                        <span className="text-(--cyber-amber)">{key}</span>
                                                        <span className="text-white/40"> = </span>
                                                        <span>{JSON.stringify(value)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-(--cyber-cyan) text-xs font-btn-font">EXPECTED</span>
                                            <div className="mt-1 text-white/80 font-nav-font">
                                                {JSON.stringify(selectedCase.expected)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-32">
                            <span className="text-white/40 font-nav-font text-sm">Waiting for problem...</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Center Panel - Workspace */}
            <div className="flex flex-col h-full overflow-hidden border-x border-white/5">
                {/* Tab Bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-(--cyber-bg-deep) border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 text-xs font-btn-font rounded transition-all ${currentToolbarOption === 'whiteboard' ? 'bg-(--cyber-cyan)/20 text-(--cyber-cyan)' : 'text-white/40'}`}>
                            {currentToolbarOption === 'whiteboard' ? '◆ Whiteboard' : '◇ Whiteboard'}
                        </span>
                        <span className={`px-3 py-1.5 text-xs font-btn-font rounded transition-all ${currentToolbarOption === 'editor' ? 'bg-(--cyber-cyan)/20 text-(--cyber-cyan)' : 'text-white/40'}`}>
                            {currentToolbarOption === 'editor' ? '◆ Code Editor' : '◇ Code Editor'}
                        </span>
                    </div>
                    {currentToolbarOption === 'editor' && (
                        <button
                            onClick={executeCode}
                            className="flex items-center gap-2 px-4 py-1.5 bg-(--cyber-cyan)/20 hover:bg-(--cyber-cyan)/30 text-(--cyber-cyan) font-btn-font text-xs rounded border border-(--cyber-cyan)/30 transition-all glow-cyan"
                        >
                            <span>▶</span>
                            <span>RUN</span>
                        </button>
                    )}
                </div>

                {/* Main Workspace Area */}
                <div className="flex-1 relative overflow-hidden">
                    <motion.div
                        animate={{
                            x: currentToolbarOption === 'whiteboard' ? 0 : '-100%',
                            pointerEvents: currentToolbarOption === 'whiteboard' ? 'auto' : 'none'
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="absolute inset-0"
                    >
                        <Whiteboard
                            height="100%"
                            width="100%"
                            onAPIReady={(api) => { excalidrawAPIRef.current = api; }}
                        />
                    </motion.div>

                    <motion.div
                        animate={{
                            x: currentToolbarOption === 'editor' ? 0 : '100%',
                            pointerEvents: currentToolbarOption === 'editor' ? 'auto' : 'none'
                        }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                        className="absolute inset-0 flex flex-col"
                    >
                        <div className="flex-1 relative">
                            <Editor
                                height="100%"
                                width="100%"
                                language={selectedLanguage.language}
                                theme='vs-dark'
                                value={code}
                                onChange={(e) => setCode(e || '')}
                                onMount={(editor) => {
                                    setEditorLoaded(true)
                                    editorRef.current = editor
                                }}
                                options={{
                                    fontSize: 14,
                                    fontFamily: 'nav-font, monospace',
                                    minimap: { enabled: false },
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
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
                    </motion.div>
                </div>

                {/* Console Output Panel */}
                <AnimatePresence>
                    {currentToolbarOption === 'editor' && (
                        <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: consoleExpanded ? 160 : 40 }}
                            exit={{ height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="bg-(--cyber-bg-deep) border-t border-white/10 overflow-hidden"
                        >
                            <div
                                className="flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => setConsoleExpanded(!consoleExpanded)}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-(--cyber-cyan) font-btn-font text-xs">CONSOLE</span>
                                    {codeExecutionResponse && (
                                        <span className={`w-2 h-2 rounded-full ${codeExecutionResponse.failedCases.length > 0 ? 'bg-red-500' : 'bg-green-500'}`} />
                                    )}
                                </div>
                                <span className="text-white/40 text-xs">{consoleExpanded ? '▼' : '▲'}</span>
                            </div>
                            {consoleExpanded && (
                                <div className="px-4 pb-3 overflow-auto h-[calc(100%-40px)]">
                                    {codeExecutionResponse ? (
                                        <div className="console-output space-y-2">
                                            {codeExecutionResponse.results.map((result) => (
                                                <div key={result.index} className={`p-2 rounded ${result.passed ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                                                    <div className={`text-xs font-btn-font mb-1 ${result.passed ? 'text-green-400' : 'text-red-400'}`}>
                                                        Test Case {result.index}: {result.passed ? 'PASSED' : 'FAILED'}
                                                    </div>
                                                    {result.stdout && (
                                                        <pre className="stdout whitespace-pre-wrap text-xs">{result.stdout}</pre>
                                                    )}
                                                    {result.stderr && (
                                                        <pre className="stderr whitespace-pre-wrap text-xs">{result.stderr}</pre>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-white/30 font-nav-font text-sm">Run your code to see output...</span>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Right Panel - Voice Command Center */}
            <div className="cyber-panel flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-(--cyber-cyan) animate-pulse-glow" />
                        <span className="text-(--cyber-cyan) font-header-font text-lg tracking-wide">
                            Voice
                        </span>
                    </div>
                    <div className="cyber-divider" />
                </div>

                <div className="flex-1 flex flex-col justify-between p-4">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <span className="text-white/40 font-btn-font text-[10px] uppercase tracking-wider">Current Agent</span>
                            <div className="text-(--cyber-amber) font-nav-font text-sm glow-amber-text">
                                {agentStatus.name || 'Connecting...'}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <AudioWave
                                stream={audioStream}
                                agent
                                isLoaded={isLoaded}
                                setIsLoaded={setIsLoaded}
                                current_agent={agentStatus.name}
                                compact
                            />
                            <AudioWave
                                stream={userAudioStream}
                                agent={false}
                                isLoaded={isLoaded}
                                setIsLoaded={setIsLoaded}
                                current_agent={agentStatus.name}
                                compact
                            />
                            {interpretingWhiteboard && <InterpretingIndicator />}
                        </div>
                    </div>

                    <div className="space-y-4 mt-auto pt-4">
                        <div className="cyber-divider" />
                        {isLoaded && (
                            <ToolBar
                                requestToolbarSwitch={requestToolbarSwitch}
                                currentOption={currentToolbarOption}
                            />
                        )}
                    </div>
                </div>
            </div>

            <EndInterviewModal
                isOpen={showEndModal}
                onConfirm={handleConfirmEnd}
                onCancel={handleCancelEnd}
            />
        </div>
    );
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
            style={{ top: topPosition + 16 }}
            className="absolute right-4 z-10 w-72"
        >
            <Card className="cyber-panel-amber p-3">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-(--cyber-amber) font-btn-font text-sm glow-amber-text">HINT</span>
                    <button
                        onClick={onDismiss}
                        className="text-white/40 hover:text-white text-sm cursor-pointer transition-colors"
                    >
                        ✕
                    </button>
                </div>
                <pre className="text-white/80 font-nav-font text-xs overflow-x-auto whitespace-pre-wrap">
                    {displayLines.join('\n')}
                </pre>
                {needsExpand && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-(--cyber-amber) hover:text-(--cyber-amber)/80 text-xs mt-2 cursor-pointer font-btn-font"
                    >
                        {expanded ? '▲ COLLAPSE' : '▼ EXPAND'}
                    </button>
                )}
            </Card>
        </motion.div>
    )
}
