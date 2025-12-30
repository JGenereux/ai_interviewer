import { Card } from "@/components/ui/card";
import type { AnimationScope } from "motion/react";
import { useEffect, useState } from "react";
import { motion, useAnimate } from 'motion/react'
import { Input } from "@/components/ui/input";
import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/authContext";
import { Link } from "react-router-dom";
import AuthAlert from "@/components/authAlert";

type LoginInfo = {
    email: string,
    password: string
}

export default function Login() {
    return <div className="flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center w-full h-full my-12">
            <Menu />
        </div>
    </div>
}

function Menu() {
    const maxMenus = 2;
    const { login } = useAuth()
    const [userInfo, setUserInfo] = useState<LoginInfo>({ email: '', password: '' })
    const [scopeTwo, animateTwo] = useAnimate()
    const [currentMenu, setCurrentMenu] = useState<number>(0);
    const [animated, setAnimated] = useState<{ t: boolean, i: number }[]>([{ t: false, i: 0 }, { t: false, i: 1 }])
    const [loginError, setLoginError] = useState<string | null>(null);

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
                    display: ['none', 'block']
                }, { duration: 0.2 })
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
        login(userInfo.email, userInfo.password, setLoginError)
    }

    return <>
        <AuthAlert 
            message={loginError} 
            type="error" 
            onClose={() => setLoginError(null)} 
        />
        <Card className="flex flex-col
        items-center
        min-w-[420px] h-fit
        bg-[#181818]
        border border-white/5
        rounded-xl
        shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)]
      ">
            <div className="flex flex-row min-w-[30%] gap-12 px-4">
                <div className="flex flex-col w-sm gap-2">
                    <h3 className="text-white font-btn-font text-xl mx-auto">Login</h3>
                    <Link to="/signup" className="mx-auto text-sm text-white font-nav-font underline">Don't have an account?</Link>
                    <MenuOne changeUserInfo={changeUserInfo} setAnimated={setAnimated} />
                    <MenuTwo scope={scopeTwo} changeUserInfo={changeUserInfo} setAnimated={setAnimated} />
                    <motion.button
                        onClick={handleLogin}
                        animate={userInfo.password ? {
                            opacity: [0, 1],
                            scale: [0, 1],
                            transformOrigin: 'center center',
                            display: ['none', 'block']
                        } : {}}
                        transition={{ duration: 0.5 }}
                        className="font-btn-font hidden opacity-0 bg-none cursor-pointer text-white w-fit mx-auto px-2 py-0.5 mt-2 rounded-lg">Login</motion.button>
                </div>
            </div>
        </Card>
    </>
}

type MenuOptionProps = {
    scope?: AnimationScope<any>;
    changeUserInfo: (k: keyof LoginInfo, v: string) => void;
    setAnimated: React.Dispatch<React.SetStateAction<{ t: boolean, i: number }[]>>;
}

function MenuOne({ changeUserInfo, setAnimated }: MenuOptionProps) {
    return <motion.div className="w-full">
        <label htmlFor='email' className="font-label-font flex flex-col text-white w-full">Email
            <Input
                id='email'
                onChange={(e) => {
                    setAnimated((p) => p.find((v) => v.i === 0)?.t === false ? p.map((v) => v.i === 0 ? { ...v, t: true } : v) : p)
                    changeUserInfo('email', e.target.value)
                }
                }
                className="
bg-[#121212]
border border-white/10
text-white
focus:border-white/30
transition
"
            />
        </label>
    </motion.div>
}

function MenuTwo({ scope, changeUserInfo, setAnimated }: MenuOptionProps) {
    return <motion.div
        ref={scope}
        className="w-full hidden opacity-0"
        style={{ scale: 0, transformOrigin: 'center center' }}
    >
        <label htmlFor='password' className="text-white font-label-font w-full">Password
            <Input
                type='password'
                id='password'
                onChange={(e) => {
                    setAnimated((p) => p.find((v) => v.i === 1)?.t === false ? p.map((v) => v.i === 1 ? { ...v, t: true } : v) : p)
                    changeUserInfo('password', e.target.value)
                }}
                className="
bg-[#121212]
border border-white/10
text-white
focus:border-white/30
transition
"
            />
        </label>
    </motion.div>
}