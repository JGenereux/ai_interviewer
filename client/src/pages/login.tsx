import { useEffect, useState } from "react";
import { motion, useAnimate } from 'motion/react'
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/authContext";
import { Link, useSearchParams } from "react-router-dom";
import AuthAlert from "@/components/authAlert";
import dbClient from "@/utils/supabaseDB";
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL

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
        <div className="hidden md:flex flex-col justify-between w-[45%] from-[#1a1a1a] via-[#161616] to-[#0f0f0f] p-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 -left-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-32 h-32 bg-green-500/20 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
                <h1 className="font-header-font text-4xl text-white mb-4">FIRSTOFFER</h1>
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
                            className={`h-1.5 rounded-full transition-all duration-300 ${step < currentMenu ? 'w-8 bg-blue-500' : step === currentMenu ? 'w-8 bg-blue-500/50' : 'w-4 bg-white/10'
                                }`}
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
            <div className={`relative flex items-center rounded-xl border transition-all duration-300 ${focused ? 'border-blue-500/50 bg-blue-500/5' : 'border-white/10 bg-[#121212]'
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

function GoogleIcon() {
    return (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M5.26620003,9.76452941 C6.19878754,6.93863203 8.85444915,4.90909091 12,4.90909091 C13.6909091,4.90909091 15.2181818,5.50909091 16.4181818,6.49090909 L19.9090909,3 C17.7818182,1.14545455 15.0545455,0 12,0 C7.27006974,0 3.1977497,2.69829785 1.23999023,6.65002441 L5.26620003,9.76452941 Z" />
            <path fill="#34A853" d="M16.0407269,18.0125889 C14.9509167,18.7163016 13.5660892,19.0909091 12,19.0909091 C8.86648613,19.0909091 6.21911939,17.076871 5.27698177,14.2678769 L1.23746264,17.3349879 C3.19279051,21.2936293 7.26500293,24 12,24 C14.9328362,24 17.7353462,22.9573905 19.834192,20.9995801 L16.0407269,18.0125889 Z" />
            <path fill="#4A90E2" d="M19.834192,20.9995801 C22.0291676,18.9520994 23.4545455,15.903663 23.4545455,12 C23.4545455,11.2909091 23.3454545,10.5272727 23.1818182,9.81818182 L12,9.81818182 L12,14.4545455 L18.4363636,14.4545455 C18.1187732,16.013626 17.2662994,17.2212117 16.0407269,18.0125889 L19.834192,20.9995801 Z" />
            <path fill="#FBBC05" d="M5.27698177,14.2678769 C5.03832634,13.556323 4.90909091,12.7937589 4.90909091,12 C4.90909091,11.2182781 5.03443647,10.4668121 5.26620003,9.76452941 L1.23999023,6.65002441 C0.43658717,8.26043162 0,10.0753848 0,12 C0,13.9195484 0.444780743,15.7## L1.23746264,17.3349879 L5.27698177,14.2678769 Z" />
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
