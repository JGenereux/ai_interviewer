import Navbar from "@/components/navbar";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { motion, useAnimate, type AnimationScope } from 'motion/react'
import React, { useEffect, useState } from "react";
import pdfToText from "react-pdftotext";
import DisplayResume from "../components/resume";
import dbClient from "@/utils/supabaseDB";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/authContext";
import AuthAlert from "@/components/authAlert";

export default function Signup() {
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
                    <FormPanel />
                    <BrandingPanel />
                </motion.div>
            </div>
        </div>
    );
}

function BrandingPanel() {
    return (
        <div className="hidden lg:flex flex-col justify-between w-[40%] bg-gradient-to-bl from-[#1a1a1a] via-[#161616] to-[#0f0f0f] p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-32 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-20 w-24 h-24 bg-amber-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
                <h1 className="font-header-font text-4xl text-white mb-4">SIGNAL</h1>
                <p className="font-nav-font text-neutral-400 text-sm leading-relaxed">
                    Join thousands of developers preparing for their dream jobs with AI-powered mock interviews.
                </p>
            </div>

            <div className="relative z-10 space-y-6">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white font-btn-font text-sm">
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

function FormPanel() {
    const maxMenus = 4;
    const { signup } = useAuth()
    const [signupError, setSignupError] = useState<string | null>(null);
    const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
    const [userInfo, setUserInfo] = useState<SignUpInfo>({ email: '', password: '', resume: '', file: null, fullName: '', userName: '' })
    const [currentMenu, setCurrentMenu] = useState<number>(0);

    const [scopeTwo, animateTwo] = useAnimate()
    const [scopeThree, animateThree] = useAnimate()
    const [fullNameScope, animateFullName] = useAnimate()
    const [userNameScope, animateUserName] = useAnimate()
    const [animated, setAnimated] = useState<{ t: boolean, i: number }[]>([{ t: false, i: 0 }, { t: false, i: 1 }, { t: false, i: 2 }, { t: false, i: 3 }])

    useEffect(() => {
        if (!animated) return
        if (!animated[currentMenu]?.t) return
        handleContinue();
    }, [animated])

    const updateUserInfo = async (extractedText: string) => {
        try {
            const res = await axios.post('http://localhost:3000/resume', {
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
            pdfToText(v)
                .then(async (extractedText) => {
                    setUserInfo((p) => ({ ...p, file: v }))
                    await updateUserInfo(extractedText)
                })
                .catch((error) => {
                    console.error('Failed to extract text from pdf', error);
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
        const { email, password, userName, fullName, resume } = userInfo
        const success = await signup(email, password, fullName, resume, userName, setSignupError)
        if (success) {
            setSignupSuccess("Check your email to verify your account")
        }
    }

    const steps = ['Email', 'Password', 'Name', 'Username', 'Resume'];

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
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i < currentMenu ? 'w-6 bg-green-500' : i === currentMenu ? 'w-6 bg-green-500/50' : 'w-3 bg-white/10'
                                }`}
                                title={step}
                            />
                        ))}
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
                                onChange={(v) => {
                                    setAnimated((p) => p.find((x) => x.i === 3)?.t === false ? p.map((x) => x.i === 3 ? { ...x, t: true } : x) : p)
                                    changeUserInfo('userName', v)
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
                            initial={{ opacity: 0, y: 10 }}
                            animate={userInfo.file ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="group w-full mt-6 font-btn-font text-base px-6 py-4 rounded-xl bg-white text-black cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] flex items-center justify-center gap-3"
                        >
                            Create Account
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
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

function InputField({ icon, label, type, placeholder, onChange }: {
    icon: React.ReactNode;
    label: string;
    type: string;
    placeholder: string;
    onChange: (value: string) => void;
}) {
    const [focused, setFocused] = useState(false);

    return (
        <div className="space-y-2">
            <label className="font-nav-font text-neutral-400 text-sm">{label}</label>
            <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${
                focused ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-[#121212]'
            }`}>
                <div className={`pl-4 transition-colors duration-300 ${focused ? 'text-green-400' : 'text-neutral-500'}`}>
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
                className={`relative rounded-xl border-2 border-dashed transition-all duration-300 p-6 text-center cursor-pointer ${
                    dragOver ? 'border-green-500 bg-green-500/10' : file ? 'border-green-500/50 bg-green-500/5' : 'border-white/10 bg-[#121212] hover:border-white/20'
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
