import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { motion, useAnimate } from 'motion/react'
import React, { useEffect, useState } from "react";
import pdfToText from "react-pdftotext";
import DisplayResume from "../components/resume";
import dbClient from "@/utils/supabaseDB";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authContext";
import AuthAlert from "@/components/authAlert";

const API_URL = import.meta.env.VITE_API_URL
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

export default function Signup() {
    const [searchParams] = useSearchParams();
    const isOAuth = searchParams.get('oauth') === 'true';

    return (
        <div className="flex flex-col min-h-screen main-bg">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex w-full max-w-5xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                >
                    <FormPanel isOAuth={isOAuth} />
                    <BrandingPanel />
                </motion.div>
            </div>
        </div>
    );
}

function BrandingPanel() {
    return (
        <div className="hidden lg:flex flex-col justify-between w-[40%] bg-linear-to-bl from-[#1a1a1a] via-[#161616] to-[#0f0f0f] p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-32 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-20 w-24 h-24 bg-amber-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
                <h1 className="font-header-font text-4xl text-white mb-4">FIRSTOFFER</h1>
                <p className="font-nav-font text-neutral-400 text-sm leading-relaxed">
                    Join thousands of developers preparing for their dream jobs with AI-powered mock interviews.
                </p>
            </div>

            <div className="relative z-10 space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-btn-font text-sm">
                            JD
                        </div>
                        <div>
                            <p className="font-btn-font text-white text-sm">Jane Doe</p>
                            <p className="font-nav-font text-neutral-500 text-xs">Landed at Google</p>
                        </div>
                    </div>
                    <p className="font-nav-font text-neutral-300 text-sm italic">
                        "Signal's AI feedback helped me understand exactly where I needed to improve."
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex -space-x-2">
                        {['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map((color, i) => (
                            <div
                                key={i}
                                className="w-8 h-8 rounded-full border-2 border-[#161616]"
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                    <p className="font-nav-font text-neutral-400 text-xs">
                        Join 1,000+ developers
                    </p>
                </div>
            </div>

            <div className="relative z-10">
                <p className="font-nav-font text-neutral-600 text-xs">
                    © 2025 Signal
                </p>
            </div>
        </div>
    );
}

type SignUpInfo = {
    email: string,
    password: string,
    resume: any,
    fullName: string,
    userName: string,
    file: File | null
}

const animationStyle = {
    opacity: [0, 1],
    scale: [0, 1],
    transformOrigin: 'center center',
    display: ['none', 'flex']
}

function FormPanel({ isOAuth }: { isOAuth: boolean }) {
    const maxMenus = 4;
    const navigate = useNavigate();
    const { signup } = useAuth()
    const [signupError, setSignupError] = useState<string | null>(null);
    const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<SignUpInfo>({ email: '', password: '', resume: '', file: null, fullName: '', userName: '' })
    const [currentMenu, setCurrentMenu] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isParsingResume, setIsParsingResume] = useState(false);
    const [takenUsernames, setTakenUsernames] = useState<string[]>([]);
    const [usernameError, setUsernameError] = useState<string | null>(null);

    const [scopeTwo, animateTwo] = useAnimate()
    const [scopeThree, animateThree] = useAnimate()
    const [fullNameScope, animateFullName] = useAnimate()
    const [userNameScope, animateUserName] = useAnimate()
    const [animated, setAnimated] = useState<{ t: boolean, i: number }[]>([{ t: false, i: 0 }, { t: false, i: 1 }, { t: false, i: 2 }, { t: false, i: 3 }])

    const [oauthResumeScope, animateOAuthResume] = useAnimate()
    const [oauthStep, setOauthStep] = useState(0)

    useEffect(() => {
        const fetchUsernames = async () => {
            try {
                const response = await axios.get(`${API_URL}/users/usernames`);
                setTakenUsernames(response.data.usernames.map((u: string) => u.toLowerCase()));
            } catch (error) {
                console.error('Failed to fetch usernames:', error);
            }
        };
        fetchUsernames();
    }, []);

    useEffect(() => {
        if (!animated) return
        if (!animated[currentMenu]?.t) return
        handleContinue();
    }, [animated])

    const updateUserInfo = async (extractedText: string) => {
        try {
            const res = await axios.post(`${API_URL}/resume`, {
                resumeText: extractedText
            })
            changeUserInfo('resume', res.data.userInfo)
        } catch (error) {
            console.error(error)
        }
    }

    const changeUserInfo = (k: keyof SignUpInfo, v: string | File | null) => {
        if (v === null) return
        if (k === 'file' && v instanceof File) {
            setIsParsingResume(true);
            setUserInfo((p) => ({ ...p, file: v }))
            pdfToText(v)
                .then(async (extractedText) => {
                    await updateUserInfo(extractedText)
                })
                .catch((error) => {
                    console.error('Failed to extract text from pdf', error);
                })
                .finally(() => {
                    setIsParsingResume(false);
                });
        } else {
            setUserInfo((p) => ({ ...p, [k]: v }))
        }
    }

    const handleContinue = async () => {
        if (currentMenu > 3) return

        switch (currentMenu) {
            case 0:
                await animateTwo(scopeTwo.current, animationStyle, { duration: 0.3 })
                break;
            case 1:
                await animateFullName(fullNameScope.current, animationStyle, { duration: 0.3 })
                break;
            case 2:
                await animateUserName(userNameScope.current, animationStyle, { duration: 0.3 })
                break;
            case 3:
                await animateThree(scopeThree.current, animationStyle, { duration: 0.3 })
                break;
        }
        setCurrentMenu((p) => p == maxMenus ? p : p + 1)
    }

    const handleSignup = async () => {
        if (usernameError) {
            setSignupError(usernameError);
            return;
        }
        const { email, password, userName, fullName, resume } = userInfo
        const success = await signup(email, password, fullName, resume, userName, setSignupError)
        if (success) {
            setSignupSuccess("Check your email to verify your account")
        }
    }

    const handleOAuthSignup = async () => {
        if (!userInfo.userName.trim()) {
            setSignupError('Username is required');
            return;
        }
        if (userInfo.userName.length < 3) {
            setSignupError('Username must be at least 3 characters');
            return;
        }
        if (!/^[a-zA-Z0-9_]+$/.test(userInfo.userName)) {
            setSignupError('Username can only contain letters, numbers, and underscores');
            return;
        }
        if (usernameError) {
            setSignupError(usernameError);
            return;
        }

        setIsSubmitting(true);
        setSignupError(null);

        try {
            const { data: sessionData } = await dbClient.auth.getSession();
            if (!sessionData.session) {
                setSignupError('Session expired. Please try again.');
                return;
            }

            const user = sessionData.session.user;

            await axios.post(`${API_URL}/users/oauth/complete`, {
                userId: user.id,
                userName: userInfo.userName.trim(),
                resume: userInfo.resume
            });

            await dbClient.auth.refreshSession();
            navigate('/pricing?newUser=true');
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.status === 409) {
                setSignupError('Username is already taken');
            } else {
                setSignupError('Failed to complete signup. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOAuthUsernameChange = async (value: string) => {
        changeUserInfo('userName', value);

        if (value.length > 0 && takenUsernames.includes(value.toLowerCase())) {
            setUsernameError('Username is already taken');
        } else {
            setUsernameError(null);
        }

        if (oauthStep === 0 && value.length > 0) {
            setOauthStep(1);
            await animateOAuthResume(oauthResumeScope.current, animationStyle, { duration: 0.3 });
        }
    };

    const steps = ['Email', 'Password', 'Name', 'Username', 'Resume (optional)'];
    const oauthSteps = ['Username', 'Resume (optional)'];

    if (isOAuth) {
        return (
            <div className="flex-1 bg-[#181818] p-10 flex flex-col">
                <AuthAlert message={signupError} type="error" onClose={() => setSignupError(null)} />

                <div className="flex-1 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="font-header-font text-3xl text-white mb-2">Almost there!</h2>
                            <p className="font-nav-font text-neutral-500 text-sm">
                                Complete your profile to get started
                            </p>
                        </div>

                        <div className="flex justify-center gap-1.5 mb-8">
                            {oauthSteps.map((step, i) => (
                                <div
                                    key={step}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i < oauthStep ? 'w-6 bg-green-500' : i === oauthStep ? 'w-6 bg-green-500/50' : 'w-3 bg-white/10'
                                        }`}
                                    title={step}
                                />
                            ))}
                        </div>

                        <div className="space-y-4">
                            <InputField
                                icon={<AtIcon />}
                                label="Username"
                                type="text"
                                placeholder="johndoe"
                                error={usernameError}
                                onChange={handleOAuthUsernameChange}
                            />

                            <motion.div ref={oauthResumeScope} className="hidden opacity-0" style={{ scale: 0, transformOrigin: 'center center' }}>
                                <FileUploadField
                                    onChange={(file) => changeUserInfo('file', file)}
                                    file={userInfo.file}
                                />
                            </motion.div>

                            <motion.button
                                onClick={handleOAuthSignup}
                                disabled={isSubmitting || isParsingResume || userInfo.userName.length < 3}
                                initial={{ opacity: 0, y: 10 }}
                                animate={userInfo.userName.length >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                                transition={{ duration: 0.3 }}
                                className="group w-full mt-6 font-btn-font text-base px-6 py-4 rounded-xl bg-white text-black cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {isParsingResume ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Processing Resume...
                                    </>
                                ) : isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        {userInfo.file ? 'Complete Setup' : 'Continue Without Resume'}
                                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>

                {userInfo.file && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-6"
                    >
                        <DisplayResume file={userInfo.file} />
                    </motion.div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-1 bg-[#181818] p-10 flex flex-col">
            <AuthAlert message={signupError} type="error" onClose={() => setSignupError(null)} />
            <AuthAlert message={signupSuccess} type="success" onClose={() => setSignupSuccess(null)} />

            <div className="flex-1 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                    <div className="text-center mb-8">
                        <h2 className="font-header-font text-3xl text-white mb-2">Create Account</h2>
                        <p className="font-nav-font text-neutral-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-green-400 hover:text-green-300 transition">Sign in</Link>
                        </p>
                    </div>

                    <div className="flex justify-center gap-1.5 mb-8">
                        {steps.map((step, i) => (
                            <div
                                key={step}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i < currentMenu ? 'w-6 bg-green-500' : i === currentMenu ? 'w-6 bg-green-500/50' : 'w-3 bg-white/10'
                                    }`}
                                title={step}
                            />
                        ))}
                    </div>

                    <div className="flex justify-center gap-4 mb-6">
                        <button
                            type="button"
                            onClick={async () => {
                                dbClient.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${FRONTEND_URL}/oauth`
                                    }
                                })
                            }}
                            className="w-12 h-12 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all duration-300"
                        >
                            <GoogleIcon />
                        </button>
                        <button
                            type="button"
                            onClick={async () => {
                                dbClient.auth.signInWithOAuth({
                                    provider: 'github',
                                    options: {
                                        redirectTo: `${FRONTEND_URL}/oauth`
                                    }
                                })
                            }}
                            className="w-12 h-12 rounded-xl bg-[#121212] border border-white/10 flex items-center justify-center cursor-pointer hover:border-white/30 hover:bg-white/5 transition-all duration-300"
                        >
                            <GitHubIcon />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="font-nav-font text-neutral-500 text-xs">or continue with email</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <div className="space-y-4">
                        <InputField
                            icon={<EmailIcon />}
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            onChange={(v) => {
                                setAnimated((p) => p.find((x) => x.i === 0)?.t === false ? p.map((x) => x.i === 0 ? { ...x, t: true } : x) : p)
                                changeUserInfo('email', v)
                            }}
                        />

                        <motion.div ref={scopeTwo} className="hidden opacity-0" style={{ scale: 0, transformOrigin: 'center center' }}>
                            <InputField
                                icon={<LockIcon />}
                                label="Password"
                                type="password"
                                placeholder="••••••••"
                                onChange={(v) => {
                                    setAnimated((p) => p.find((x) => x.i === 1)?.t === false ? p.map((x) => x.i === 1 ? { ...x, t: true } : x) : p)
                                    changeUserInfo('password', v)
                                }}
                            />
                        </motion.div>

                        <motion.div ref={fullNameScope} className="hidden opacity-0" style={{ scale: 0, transformOrigin: 'center center' }}>
                            <InputField
                                icon={<UserIcon />}
                                label="Full Name"
                                type="text"
                                placeholder="John Doe"
                                onChange={(v) => {
                                    setAnimated((p) => p.find((x) => x.i === 2)?.t === false ? p.map((x) => x.i === 2 ? { ...x, t: true } : x) : p)
                                    changeUserInfo('fullName', v)
                                }}
                            />
                        </motion.div>

                        <motion.div ref={userNameScope} className="hidden opacity-0" style={{ scale: 0, transformOrigin: 'center center' }}>
                            <InputField
                                icon={<AtIcon />}
                                label="Username"
                                type="text"
                                placeholder="johndoe"
                                error={usernameError}
                                onChange={(v) => {
                                    setAnimated((p) => p.find((x) => x.i === 3)?.t === false ? p.map((x) => x.i === 3 ? { ...x, t: true } : x) : p)
                                    changeUserInfo('userName', v)
                                    if (v.length > 0 && takenUsernames.includes(v.toLowerCase())) {
                                        setUsernameError('Username is already taken');
                                    } else {
                                        setUsernameError(null);
                                    }
                                }}
                            />
                        </motion.div>

                        <motion.div ref={scopeThree} className="hidden opacity-0" style={{ scale: 0, transformOrigin: 'center center' }}>
                            <FileUploadField
                                onChange={(file) => {
                                    setAnimated((p) => p.find((x) => x.i === 4)?.t === false ? p.map((x) => x.i === 4 ? { ...x, t: true } : x) : p)
                                    changeUserInfo('file', file)
                                }}
                                file={userInfo.file}
                            />
                        </motion.div>

                        <motion.button
                            onClick={handleSignup}
                            disabled={isParsingResume || !userInfo.userName}
                            initial={{ opacity: 0, y: 10 }}
                            animate={userInfo.userName ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="group w-full mt-6 font-btn-font text-base px-6 py-4 rounded-xl bg-white text-black cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                            {isParsingResume ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                    Processing Resume...
                                </>
                            ) : (
                                <>
                                    {userInfo.file ? 'Create Account' : 'Continue Without Resume'}
                                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </div>

            {userInfo.file && (
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mt-6"
                >
                    <DisplayResume file={userInfo.file} />
                </motion.div>
            )}
        </div>
    );
}

function InputField({ icon, label, type, placeholder, onChange, error }: {
    icon: React.ReactNode;
    label: string;
    type: string;
    placeholder: string;
    onChange: (value: string) => void;
    error?: string | null;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="space-y-2">
            <label className="font-nav-font text-neutral-400 text-sm">{label}</label>
            <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${error ? 'border-red-500/50 bg-red-500/5' : focused ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-[#121212]'
                }`}>
                <div className={`pl-4 transition-colors duration-300 ${error ? 'text-red-400' : focused ? 'text-green-400' : 'text-neutral-500'}`}>
                    {icon}
                </div>
                <Input
                    type={type}
                    placeholder={placeholder}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-transparent border-0 text-white placeholder:text-neutral-600 focus-visible:ring-0 focus-visible:ring-offset-0 py-4"
                />
            </div>
            {error && <p className="font-nav-font text-red-400 text-xs">{error}</p>}
        </div>
    );
}

function FileUploadField({ onChange, file }: { onChange: (file: File | null) => void; file: File | null }) {
    const [dragOver, setDragOver] = useState(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile?.type === 'application/pdf') {
            onChange(droppedFile);
        }
    };

    return (
        <div className="space-y-2">
            <label className="font-nav-font text-neutral-400 text-sm">Resume (PDF)</label>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-6 text-center cursor-pointer ${dragOver ? 'border-green-500 bg-green-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-[#121212] hover:border-white/20'
                    }`}
            >
                <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => onChange(e.target.files?.[0] || null)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {file ? (
                    <div className="flex items-center justify-center gap-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-nav-font text-green-400 text-sm">{file.name}</span>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <svg className="w-8 h-8 text-neutral-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="font-nav-font text-neutral-500 text-sm">Drop your resume or click to upload</p>
                    </div>
                )}
            </div>
            <p className="font-nav-font text-neutral-600 text-xs flex items-start gap-1.5 mt-2">
                <svg className="w-3 h-3 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>We extract only your skills and experience for interview practice. Your resume file, contact info, and personal details are never stored.</span>
            </p>
        </div>
    );
}

function EmailIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function LockIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}

function UserIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function AtIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
        </svg>
    );
}

function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
            <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
            <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
            <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7301709 1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
        </svg>
    );
}

function GitHubIcon() {
    return (
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}
