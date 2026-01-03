import { useState } from "react"
import { useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "motion/react"
import axios from "axios"
import { useAccessGate } from "@/contexts/accessGateContext"

const API_URL = import.meta.env.VITE_API_URL

const BYPASS_ROUTES = ['/oauth', '/login', '/signup']

export default function AccessGate({ children }: { children: React.ReactNode }) {
    const location = useLocation()
    const { isUnlocked, unlock } = useAccessGate()
    
    const shouldBypass = BYPASS_ROUTES.some(route => location.pathname.startsWith(route))
    const [email, setEmail] = useState("")
    const [accessCode, setAccessCode] = useState("")
    const [waitlistStatus, setWaitlistStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [codeStatus, setCodeStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false)
    const [isSubmittingCode, setIsSubmittingCode] = useState(false)

    const handleWaitlistSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim()) return

        setIsSubmittingWaitlist(true)
        setWaitlistStatus(null)

        try {
            const response = await axios.post(`${API_URL}/gate/waitlist`, { email })
            setWaitlistStatus({ type: "success", message: response.data.message })
            setEmail("")
        } catch (error: any) {
            setWaitlistStatus({ 
                type: "error", 
                message: error.response?.data?.error || "Failed to join waitlist" 
            })
        } finally {
            setIsSubmittingWaitlist(false)
        }
    }

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!accessCode.trim()) return

        setIsSubmittingCode(true)
        setCodeStatus(null)

        try {
            const response = await axios.post(`${API_URL}/gate/access-code/validate`, { code: accessCode })
            if (response.data.valid) {
                setCodeStatus({ type: "success", message: "Access granted!" })
                setTimeout(() => unlock(), 500)
            } else {
                setCodeStatus({ type: "error", message: response.data.error || "Invalid code" })
            }
        } catch (error: any) {
            setCodeStatus({ 
                type: "error", 
                message: error.response?.data?.error || "Failed to validate code" 
            })
        } finally {
            setIsSubmittingCode(false)
        }
    }

    if (isUnlocked || shouldBypass) {
        return <>{children}</>
    }

    return (
        <div className="fixed inset-0 z-50 main-bg overflow-y-auto">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
            <div className="min-h-full flex items-center justify-center px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative w-full max-w-lg"
                >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center mb-10"
                >
                    <h1 className="font-header-font text-5xl md:text-7xl text-white tracking-tight mb-4">
                        FIRSTOFFER
                    </h1>
                    <p className="font-nav-font text-neutral-400 text-lg">
                        AI-powered FAANG interview practice
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="relative"
                >
                    <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-white/10 to-transparent" />
                    <div className="relative bg-[#161616] rounded-2xl border border-white/5 p-8">
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <h2 className="font-btn-font text-white text-lg">Join the Waitlist</h2>
                            </div>
                            <p className="font-nav-font text-neutral-500 text-sm mb-4">
                                Be the first to know when we launch. Get early access and exclusive updates.
                            </p>
                            
                            <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-nav-font text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-colors"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmittingWaitlist || !email.trim()}
                                    className="px-6 py-3 bg-white text-black font-btn-font text-sm rounded-xl hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isSubmittingWaitlist ? "Joining..." : "Join Waitlist"}
                                </button>
                            </form>

                            <AnimatePresence mode="wait">
                                {waitlistStatus && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`mt-3 font-nav-font text-sm ${
                                            waitlistStatus.type === "success" ? "text-green-400" : "text-red-400"
                                        }`}
                                    >
                                        {waitlistStatus.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <h2 className="font-btn-font text-white text-lg">Have an Access Code?</h2>
                            </div>
                            <p className="font-nav-font text-neutral-500 text-sm mb-4">
                                Enter your early access code to unlock the platform.
                            </p>
                            
                            <form onSubmit={handleCodeSubmit} className="flex flex-col sm:flex-row gap-3">
                                <input
                                    type="text"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                    placeholder="Enter access code"
                                    className="flex-1 px-4 py-3 bg-[#1a1a1a] border border-white/10 rounded-xl text-white font-nav-font text-sm placeholder:text-neutral-600 focus:outline-none focus:border-white/20 transition-colors uppercase tracking-widest"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmittingCode || !accessCode.trim()}
                                    className="px-6 py-3 bg-transparent border border-white/20 text-white font-btn-font text-sm rounded-xl hover:bg-white/5 hover:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    {isSubmittingCode ? "Checking..." : "Unlock Access"}
                                </button>
                            </form>

                            <AnimatePresence mode="wait">
                                {codeStatus && (
                                    <motion.p
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className={`mt-3 font-nav-font text-sm ${
                                            codeStatus.type === "success" ? "text-green-400" : "text-red-400"
                                        }`}
                                    >
                                        {codeStatus.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-center mt-8 font-nav-font text-neutral-600 text-xs"
                >
                    © 2026 FirstOffer. All rights reserved.
                </motion.p>
                </motion.div>
            </div>
        </div>
    )
}

