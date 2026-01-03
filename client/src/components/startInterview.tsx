import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/authContext";
import { useNavigate } from "react-router-dom";

const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
};

export type InterviewMode = 'full' | 'behavioral' | 'technical';

type ValueProps = {
    option: string,
    values: string[],
    selectedValue: string | undefined,
    handleChangeInfo: (option: string, value: string) => void
}

const options = [
    {
        option: 'Role',
        values: [
            'Software Engineer',
            'Frontend Engineer',
            'Backend Engineer',
            'Full Stack Engineer',
            'DevOps Engineer',
            'Data Engineer'
        ],
        number: '01'
    },
    {
        option: 'Mode',
        values: [
            'Full Interview',
            'Behavioral Only',
            'Technical Only'
        ],
        number: '02'
    }
]

const languageOption = {
    option: 'Language',
    values: [
        'JavaScript',
        'Python',
        'Java',
        'C++',
        'Go'
    ],
    number: '03'
}

const languageMap: Record<string, string> = {
    'JavaScript': 'javascript',
    'Python': 'python',
    'Java': 'java',
    'C++': 'c++',
    'Go': 'go'
}

const modeMap: Record<string, InterviewMode> = {
    'Full Interview': 'full',
    'Behavioral Only': 'behavioral',
    'Technical Only': 'technical'
};

type StartInterviewProps = {
    startAgent: (mode: InterviewMode, language?: string) => Promise<void>
}

const TOKENS_PER_INTERVIEW = 750; // ~15 min interview

export default function StartInterview({ startAgent }: StartInterviewProps) {
    const { id: userId, tokens } = useAuth();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [info, setInfo] = useState<{ option: string, value: string }[]>([])
    const isLoggedIn = Boolean(userId);
    const hasEnoughTokens = tokens >= TOKENS_PER_INTERVIEW;
    const estimatedInterviews = Math.floor(tokens / TOKENS_PER_INTERVIEW);

    const handleChangeInfo = (option: string, value: string) => {
        let currInfo = [...info];
        const i = currInfo.findIndex((l) => l.option === option)
        if (i === -1) {
            currInfo = [...currInfo, { option, value }]
        } else {
            currInfo[i] = { option, value };
        }

        if (option === 'Mode' && value === 'Behavioral Only') {
            currInfo = currInfo.filter((item) => item.option !== 'Language')
        }

        setInfo(currInfo)
    }

    const getSelectedValue = (option: string) => {
        return info.find((i) => i.option === option)?.value
    }

    const selectedMode = getSelectedValue('Mode')
    const showLanguageSelector = selectedMode === 'Full Interview' || selectedMode === 'Technical Only'

    const isFormValid = () => {
        if (!hasEnoughTokens) return false
        const hasRole = Boolean(getSelectedValue('Role'))
        const hasMode = Boolean(getSelectedValue('Mode'))
        const hasLanguage = Boolean(getSelectedValue('Language'))

        if (!hasRole || !hasMode) return false
        if (showLanguageSelector && !hasLanguage) return false
        return true
    }

    const handleStart = () => {
        if (!isFormValid()) return
        const modeValue = getSelectedValue('Mode')!
        const mode = modeMap[modeValue];
        const languageValue = getSelectedValue('Language')
        const language = languageValue ? languageMap[languageValue] : undefined
        startAgent(mode, language);
    }

    return (
        <Card className="self-center mx-auto justify-center gap-8 lg:gap-20 flex flex-col lg:flex-row h-[90%] bg-transparent border-0 w-full lg:w-fit px-4 lg:px-0 overflow-y-auto subtle-scrollbar">
            <div className="flex flex-col gap-3 self-center w-full lg:w-auto">
                {isLoggedIn ? (
                    <>
                        {!hasEnoughTokens && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    <span className="font-btn-font text-amber-400 text-sm">No Interviews Remaining</span>
                                </div>
                                <p className="font-nav-font text-amber-200/70 text-xs mb-3">
                                    You've used all your interview credits. Get more to continue practicing.
                                </p>
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="font-btn-font text-xs px-4 py-2 bg-amber-500 text-black rounded cursor-pointer hover:bg-amber-400 transition-colors"
                                >
                                    Get More Interviews
                                </button>
                            </motion.div>
                        )}

                        {hasEnoughTokens && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 flex items-center gap-2 group relative cursor-default"
                            >
                                <div className="w-2 h-2 rounded-full bg-(--cyber-cyan)" />
                                <span className="font-nav-font text-white/50 text-xs">
                                    ~{estimatedInterviews} interview{estimatedInterviews !== 1 ? 's' : ''} remaining
                                </span>
                                <div className="absolute left-0 -top-8 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <div className="px-2 py-1 bg-black/90 border border-white/10 rounded text-white/70 font-nav-font text-[10px] whitespace-nowrap">
                                        {tokens.toLocaleString()} tokens
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-white/30 font-nav-font text-xs uppercase tracking-[0.2em] mb-4"
                        >
                            Configure your session
                        </motion.p>

                        {isMobile && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30"
                            >
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="font-nav-font text-blue-200/70 text-xs">
                                        Technical interviews require a desktop browser for the code editor and whiteboard.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {options?.map((op, index) => (
                            <motion.div
                                key={op.option}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                {...(op.option === 'Mode' ? { 'data-tour': 'mode-selector' } : {})}
                            >
                                <ValueSelector
                                    option={op.option}
                                    values={op.values}
                                    selectedValue={getSelectedValue(op.option)}
                                    handleChangeInfo={handleChangeInfo}
                                    number={op.number}
                                    disabledValues={op.option === 'Mode' && isMobile ? ['Full Interview', 'Technical Only'] : []}
                                    disabledMessage={op.option === 'Mode' && isMobile ? 'Desktop only' : undefined}
                                />
                            </motion.div>
                        ))}

                        <AnimatePresence>
                            {showLanguageSelector && (
                                <motion.div
                                    key="language-selector"
                                    initial={{ opacity: 0, x: -10, height: 0 }}
                                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                                    exit={{ opacity: 0, x: -10, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ValueSelector
                                        option={languageOption.option}
                                        values={languageOption.values}
                                        selectedValue={getSelectedValue(languageOption.option)}
                                        handleChangeInfo={handleChangeInfo}
                                        number={languageOption.number}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4, delay: 0.35 }}
                            className="flex items-center gap-6 mt-6"
                        >
                            <button
                                onClick={handleStart}
                                disabled={!isFormValid()}
                                className={`group font-nav-font text-sm px-8 py-3 transition-all duration-200 ${isFormValid()
                                    ? 'bg-white text-black cursor-pointer hover:bg-white/90'
                                    : 'bg-white/20 text-white/40 cursor-not-allowed'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    Start
                                    <svg className={`w-4 h-4 transition-transform ${isFormValid() ? 'group-hover:translate-x-0.5' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </span>
                            </button>
                            <span className="text-white/20 font-nav-font text-xs cursor-pointer hover:text-white/40 transition-colors">
                                Need help?
                            </span>
                        </motion.div>
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-start gap-4"
                    >
                        <div className="flex items-center gap-3">
                            <svg className="w-5 h-5 text-[#33ff33]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="font-nav-font text-sm text-white/70">Sign in to start</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="font-nav-font text-sm px-6 py-2.5 bg-white text-black cursor-pointer hover:bg-white/90 transition-colors"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => navigate('/signup')}
                                className="font-nav-font text-sm px-6 py-2.5 border border-white/20 text-white/60 cursor-pointer hover:border-white/40 hover:text-white transition-colors"
                            >
                                Sign Up
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="hidden lg:flex flex-col w-[380px] gap-10 self-center"
            >
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-px bg-white/20" />
                        <span className="text-white/30 font-nav-font text-xs uppercase tracking-[0.15em]">Process</span>
                    </div>
                    <p className="font-nav-font text-white/60 text-sm leading-relaxed">
                        Your resume shapes the interview. We identify strengths, target weak points,
                        and match questions to your background. Real conversation patterns make it feel authentic.
                    </p>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-5 h-px bg-white/20" />
                        <span className="text-white/30 font-nav-font text-xs uppercase tracking-[0.15em]">Structure</span>
                    </div>
                    <p className="font-nav-font text-white/60 text-sm leading-relaxed">
                        Behavioral round first—questions based on your experience. Then coding—solve problems
                        with a whiteboard and editor. Ask for hints anytime.
                    </p>
                </div>
            </motion.div>
        </Card>
    )
}

type ValueSelectorProps = ValueProps & {
    number: string;
    disabledValues?: string[];
    disabledMessage?: string;
}

function ValueSelector({ option, values, selectedValue, handleChangeInfo, number, disabledValues = [], disabledMessage }: ValueSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group w-full lg:w-[320px] px-0 py-3 text-left transition-all duration-200 cursor-pointer border-b ${isOpen ? 'border-white/30' : 'border-white/10 hover:border-white/20'
                    }`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-nav-font text-[10px] text-white/20 tabular-nums">
                            {number}
                        </span>
                        <div className="flex flex-col">
                            <span className="font-nav-font text-[10px] uppercase tracking-[0.15em] text-white/30">
                                {option}
                            </span>
                            <span className={`font-nav-font text-sm mt-0.5 transition-colors ${selectedValue ? 'text-white' : 'text-white/40'
                                }`}>
                                {selectedValue || 'Select'}
                            </span>
                        </div>
                    </div>
                    <svg
                        className={`w-4 h-4 text-white/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 right-0 z-50 overflow-hidden"
                    >
                        <div className="bg-[#0a0a0a] border border-white/10 border-t-0 mt-px">
                            {values?.map((v, i) => {
                                const isDisabled = disabledValues.includes(v);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            handleChangeInfo(option, v);
                                            setIsOpen(false);
                                        }}
                                        disabled={isDisabled}
                                        className={`w-full px-4 py-2.5 text-left font-nav-font text-sm transition-all duration-150 flex items-center justify-between gap-3 ${isDisabled
                                            ? 'text-white/20 cursor-not-allowed'
                                            : selectedValue === v
                                                ? 'text-white bg-white/5 cursor-pointer'
                                                : 'text-white/50 hover:text-white hover:bg-white/2 cursor-pointer'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-1 h-1 rounded-full transition-all ${isDisabled
                                                ? 'bg-white/10'
                                                : selectedValue === v ? 'bg-white' : 'bg-white/20'
                                                }`} />
                                            {v}
                                        </div>
                                        {isDisabled && disabledMessage && (
                                            <span className="text-[10px] text-white/30 uppercase tracking-wider">{disabledMessage}</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
