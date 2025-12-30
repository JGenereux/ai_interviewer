import type { AnimationScope } from "motion/react";
import { useEffect, useState } from "react";
import { motion, useAnimate } from 'motion/react'
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/authContext";
import { Link, useSearchParams } from "react-router-dom";
import AuthAlert from "@/components/authAlert";

type LoginInfo = {
    email: string,
    password: string
}

export default function Login() {
    return (
        <div className="flex flex-col min-h-screen main-bg">
            <Navbar />
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="flex w-full max-w-4xl rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
                >
                    <BrandingPanel />
                    <FormPanel />
                </motion.div>
            </div>
        </div>
    );
}

function BrandingPanel() {
    return (
        <div className="hidden md:flex flex-col justify-between w-[45%] bg-gradient-to-br from-[#1a1a1a] via-[#161616] to-[#0f0f0f] p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10">
                <h1 className="font-header-font text-4xl text-white mb-4">SIGNAL</h1>
                <p className="font-nav-font text-neutral-400 text-sm leading-relaxed">
                    Practice makes perfect. Sign in to continue your interview prep journey.
                </p>
            </div>

            <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-nav-font text-neutral-300 text-sm">Real FAANG questions</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <span className="font-nav-font text-neutral-300 text-sm">AI-powered feedback</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <span className="font-nav-font text-neutral-300 text-sm">Practice anytime</span>
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

function FormPanel() {
    const maxMenus = 2;
    const { login, addUser } = useAuth()
    const [userInfo, setUserInfo] = useState<LoginInfo>({ email: '', password: '' })
    const [scopeTwo, animateTwo] = useAnimate()
    const [currentMenu, setCurrentMenu] = useState<number>(0);
    const [animated, setAnimated] = useState<{ t: boolean, i: number }[]>([{ t: false, i: 0 }, { t: false, i: 1 }])
    const [loginError, setLoginError] = useState<string | null>(null);
    const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
    const [isNewUser, setIsNewUser] = useState(false);
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const sessionID = searchParams.get('sessionID')
        if (!sessionID) return
        
        setIsNewUser(true)
        const confirmAccount = async () => {
            await addUser(sessionID)
            setLoginSuccess("Your account has been verified! You can now log in.")
        }
        confirmAccount()
    }, [searchParams, addUser])

    useEffect(() => {
        if (!animated) return
        if (!animated[currentMenu]?.t) return
        handleContinue();
    }, [animated])

    const handleContinue = async () => {
        if (currentMenu > 2) return

        switch (currentMenu) {
            case 0:
                const l = animateTwo(scopeTwo.current, {
                    opacity: [0, 1],
                    scale: [0, 1],
                    transformOrigin: 'center center',
                    display: ['none', 'flex']
                }, { duration: 0.3 })
                await l.finished
                break;
        }
        setCurrentMenu((p) => p == maxMenus ? p : p + 1)
    }

    const changeUserInfo = (k: keyof LoginInfo, v: string) => {
        if (v === null) return
        setUserInfo((p) => ({ ...p, [k]: v }))
    }

    const handleLogin = () => {
        const redirectPath = searchParams.get('redirect');
        const priceId = searchParams.get('priceId');
        
        let redirectTo: string | undefined;
        if (isNewUser) {
            redirectTo = '/pricing?newUser=true';
        } else if (redirectPath) {
            redirectTo = priceId ? `${redirectPath}?priceId=${priceId}` : redirectPath;
        }
        
        login(userInfo.email, userInfo.password, setLoginError, redirectTo)
    }

    return (
        <div className="flex-1 bg-[#181818] p-10 flex flex-col justify-center">
            <AuthAlert
                message={loginError}
                type="error"
                onClose={() => setLoginError(null)}
            />
            <AuthAlert
                message={loginSuccess}
                type="success"
                onClose={() => setLoginSuccess(null)}
            />

            <div className="max-w-sm mx-auto w-full">
                <div className="text-center mb-8">
                    <h2 className="font-header-font text-3xl text-white mb-2">Welcome Back</h2>
                    <p className="font-nav-font text-neutral-500 text-sm">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-blue-400 hover:text-blue-300 transition">Sign up</Link>
                    </p>
                </div>

                <div className="flex justify-center gap-2 mb-8">
                    {[0, 1].map((step) => (
                        <div
                            key={step}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                step < currentMenu ? 'w-8 bg-blue-500' : step === currentMenu ? 'w-8 bg-blue-500/50' : 'w-4 bg-white/10'
                            }`}
                        />
                    ))}
                </div>

                <div className="space-y-4">
                    <InputField
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        }
                        label="Email"
                        type="email"
                        placeholder="you@example.com"
                        onChange={(v) => {
                            setAnimated((p) => p.find((v) => v.i === 0)?.t === false ? p.map((v) => v.i === 0 ? { ...v, t: true } : v) : p)
                            changeUserInfo('email', v)
                        }}
                    />

                    <motion.div
                        ref={scopeTwo}
                        className="hidden opacity-0"
                        style={{ scale: 0, transformOrigin: 'center center' }}
                    >
                        <InputField
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            }
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            onChange={(v) => {
                                setAnimated((p) => p.find((v) => v.i === 1)?.t === false ? p.map((v) => v.i === 1 ? { ...v, t: true } : v) : p)
                                changeUserInfo('password', v)
                            }}
                        />
                    </motion.div>

                    <motion.button
                        onClick={handleLogin}
                        initial={{ opacity: 0, y: 10 }}
                        animate={userInfo.password ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                        transition={{ duration: 0.3 }}
                        className="group w-full mt-6 font-btn-font text-base px-6 py-4 rounded-xl bg-white text-black cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] flex items-center justify-center gap-3"
                    >
                        Sign In
                        <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </motion.button>
                </div>
            </div>
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
                focused ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-[#121212]'
            }`}>
                <div className={`pl-4 transition-colors duration-300 ${focused ? 'text-blue-400' : 'text-neutral-500'}`}>
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
