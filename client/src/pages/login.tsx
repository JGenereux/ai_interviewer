import Navbar from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { motion, useAnimate, type AnimationScope } from 'motion/react'
import React, { useEffect, useState } from "react";
import pdfToText from "react-pdftotext";
import DisplayResume from "./resume";

export default function Login() {
    return <div className="flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center w-full h-full my-12">
            <Menu />
        </div>
    </div>
}

type SignUpInfo = {
    email: string,
    password: string,
    resume: string,
    file: File | null
}

const animationStyle = {
    opacity: [0, 1],
    scale: [0, 1],
    transformOrigin: 'center center',
    display: ['none', 'block']
}

function Menu() {
    const maxMenus = 3;
    const [userInfo, setUserInfo] = useState<SignUpInfo>({ email: '', password: '', resume: '', file: null })
    const [currentMenu, setCurrentMenu] = useState<number>(0); // index of menu to represent
    const [scope, animate] = useAnimate()
    const [scopeTwo, animateTwo] = useAnimate()
    const [scopeThree, animateThree] = useAnimate()
    const [animated, setAnimated] = useState<{ t: boolean, i: number }[]>([{ t: false, i: 0 }, { t: false, i: 1 }, { t: false, i: 2 }])

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

            sessionStorage.setItem('user', JSON.stringify(res.data.userInfo))
        } catch (error) {
            console.error(error)
        }
    }

    const changeUserInfo = (k: keyof SignUpInfo, v: string | File | null) => {
        if (v === null) return
        if (k === 'resume' && v instanceof File) {
            pdfToText(v)
                .then(async (extractedText) => {
                    setUserInfo((p) => ({ ...p, resume: extractedText, file: v }))
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
        if (currentMenu > 1) return

        switch (currentMenu) {
            case 0:
                const l = animateTwo(scopeTwo.current, animationStyle, { duration: 0.2 })
                await l.finished
                break;
            case 1:
                const l2 = animateThree(scopeThree.current, animationStyle, { duration: 0.2 })
                await l2.finished
                break;
        }
        setCurrentMenu((p) => p == maxMenus ? p : p + 1)
    }

    return <Card className="
    flex flex-col
    items-center
    min-w-[420px] h-fit
    bg-[#181818]
    border border-white/5
    rounded-xl
    shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)]
  ">
        <div className="flex flex-row min-w-[30%] gap-12 px-4">
            <div className="flex flex-col w-sm gap-2">
                <MenuOne scope={scope} changeUserInfo={changeUserInfo} setAnimated={setAnimated} />
                <MenuTwo scope={scopeTwo} changeUserInfo={changeUserInfo} setAnimated={setAnimated} />
                <MenuThree scope={scopeThree} changeUserInfo={changeUserInfo} setAnimated={setAnimated} />
                <motion.button
                    onClick={() => sessionStorage.setItem('userInfo', JSON.stringify(userInfo))}
                    animate={userInfo.file ? animationStyle : {}}
                    transition={{ duration: 0.5 }}
                    className="font-btn-font hidden opacity-0 bg-none cursor-pointer text-white w-fit mx-auto px-2 py-0.5 mt-2 rounded-lg">Sign Up</motion.button>
            </div>
            {(userInfo.file) && <DisplayResume file={userInfo.file} />}
        </div>
    </Card>
}

type MenuOptionProps = {
    scope: AnimationScope<any>;
    changeUserInfo: (k: keyof SignUpInfo, v: string | File | null) => void;
    setAnimated: React.Dispatch<React.SetStateAction<{ t: boolean, i: number }[]>>;
}

function MenuOne({ scope, changeUserInfo, setAnimated }: MenuOptionProps) {
    return <motion.div ref={scope} className="w-full">
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

function MenuThree({ scope, changeUserInfo, setAnimated }: MenuOptionProps) {
    return <motion.div
        ref={scope}
        className="w-full hidden opacity-0"
        style={{ scale: 0, transformOrigin: 'center center' }}
    >
        <label htmlFor='resume' className="text-white w-full font-label-font">Upload Resume
            <Input
                type='file'
                accept="application/pdf"
                id='resume'
                onChange={(e) => {
                    setAnimated((p) => p.find((v) => v.i === 2)?.t === false ? p.map((v) => v.i === 2 ? { ...v, t: true } : v) : p)
                    changeUserInfo('resume', e.target?.files ? e.target.files[0] : null)
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