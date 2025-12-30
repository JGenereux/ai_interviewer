import Navbar from "@/components/navbar";
import { motion, useInView } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
    return (
        <div className="main-bg min-h-screen overflow-x-hidden">
            <Navbar />
            <HeroSection />
            <AnimatedDivider />
            <ProcessSection />
            <AnimatedDivider />
            <InterviewShowcase />
            <AnimatedDivider />
            <StatsSection />
            <AnimatedDivider />
            <TestimonialsSection />
            <FinalCTA />
            <Footer />
        </div>
    );
}

function AnimatedDivider() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    return (
        <div ref={ref} className="flex items-center justify-center py-4">
            <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={isInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="h-px w-32 bg-linear-to-r from-transparent via-white/20 to-transparent"
            />
        </div>
    );
}

function HeroSection() {
    const navigate = useNavigate();

    const companies = [
        { name: "Google", color: "#4285F4" },
        { name: "Meta", color: "#0668E1" },
        { name: "Amazon", color: "#FF9900" },
        { name: "Microsoft", color: "#00A4EF" },
        { name: "Apple", color: "#A2AAAD" },
    ];

    return (
        <section className="flex flex-col items-center justify-center px-6 pt-8 pb-16">
            <motion.h1
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="font-header-font text-6xl md:text-8xl text-white text-center tracking-tight mb-10"
            >
                SIGNAL
            </motion.h1>

            <motion.div
                initial={{ opacity: 0, y: -100, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-4xl aspect-video bg-[#1a1a1a] rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-8"
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        <span className="text-white/40 font-nav-font text-sm">Video Placeholder</span>
                    </div>
                </div>
                <div className="absolute inset-0 bg-linear-to-t from-[#121212] via-transparent to-transparent opacity-60" />
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap items-center justify-center gap-6 mb-8"
            >
                <span className="font-nav-font text-neutral-600 text-xs uppercase tracking-widest">Questions from</span>
                {companies.map((company, index) => (
                    <motion.div
                        key={company.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.8 + index * 0.08 }}
                        className="flex items-center gap-1.5"
                    >
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: company.color }}
                        />
                        <span className="font-nav-font text-neutral-500 text-sm">{company.name}</span>
                    </motion.div>
                ))}
            </motion.div>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
                className="font-nav-font text-neutral-400 text-center text-lg md:text-xl max-w-2xl mb-8"
            >
                AI-powered FAANG interviewer that helps you practice behavioral and technical rounds
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
            >
                <button
                    onClick={() => navigate("/interview")}
                    className="group relative font-btn-font px-12 py-5 text-lg cursor-pointer overflow-hidden rounded-full border border-white/20 bg-transparent text-white transition-all duration-300 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                >
                    <span className="relative z-10 flex items-center gap-3">
                        Start Interview
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </span>
                    <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>
            </motion.div>
        </section>
    );
}

function ProcessSection() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
    const [revealedCards, setRevealedCards] = useState(0);

    useEffect(() => {
        if (isInView && revealedCards < 3) {
            const timer = setTimeout(() => {
                setRevealedCards((prev) => prev + 1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isInView, revealedCards]);

    const cards = [
        {
            title: "TALK",
            subtitle: "Behavioral Round",
            description: "Answer real FAANG behavioral questions about your experience, problem-solving approach, and leadership style.",
            accent: "#3B82F6",
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            ),
        },
        {
            title: "CODE",
            subtitle: "Technical Round",
            description: "Solve real coding challenges with an AI interviewer that guides you, evaluates your approach, and provides hints.",
            accent: "#10B981",
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            ),
        },
        {
            title: "GROW",
            subtitle: "Feedback Report",
            description: "Get actionable insights on your communication, problem-solving skills, and code quality to improve faster.",
            accent: "#F59E0B",
            icon: (
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
        },
    ];

    return (
        <section ref={sectionRef} className="px-6 py-24">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-header-font text-4xl md:text-5xl text-white text-center mb-4"
            >
                THE PROCESS
            </motion.h2>
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-nav-font text-neutral-500 text-center mb-16 text-sm"
            >
                Three steps to interview mastery
            </motion.p>

            <div className="flex flex-col md:flex-row items-stretch justify-center gap-6 max-w-6xl mx-auto">
                {cards.map((card, index) => {
                    const isRevealed = revealedCards > index;
                    const allRevealed = revealedCards >= 3;

                    return (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{
                                opacity: isInView ? 1 : 0,
                                y: isInView ? 0 : 50,
                                scale: allRevealed ? 1 : isRevealed ? 1.02 : 0.96,
                                filter: allRevealed ? "blur(0px)" : isRevealed ? "blur(0px)" : "blur(3px)",
                            }}
                            transition={{
                                duration: 0.7,
                                delay: index * 0.2,
                                ease: [0.16, 1, 0.3, 1],
                            }}
                            className="group relative flex-1 max-w-sm"
                        >
                            <div
                                className={`absolute -inset-px rounded-2xl opacity-0 blur-sm transition-opacity duration-700 ${isRevealed || allRevealed ? "group-hover:opacity-100" : ""}`}
                                style={{ background: `linear-gradient(135deg, ${card.accent}40, transparent)` }}
                            />
                            <div className={`relative h-full p-8 rounded-2xl bg-[#161616] border transition-all duration-500 ${isRevealed || allRevealed
                                ? "border-white/10 hover:border-white/20"
                                : "border-white/5"
                                }`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div
                                        className={`p-3 rounded-xl transition-all duration-500 ${isRevealed || allRevealed ? "opacity-100" : "opacity-30"}`}
                                        style={{ backgroundColor: `${card.accent}15` }}
                                    >
                                        <div style={{ color: card.accent }}>{card.icon}</div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                                        <span className="font-btn-font text-white/40 text-xs">{index + 1}</span>
                                    </div>
                                </div>
                                <h3 className="font-header-font text-3xl text-white mb-2">{card.title}</h3>
                                <p className="font-btn-font text-xs uppercase tracking-wider mb-4" style={{ color: card.accent }}>{card.subtitle}</p>
                                <p className="font-nav-font text-neutral-400 text-sm leading-relaxed">{card.description}</p>

                                {index < 2 && (
                                    <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                                        <div className="w-6 h-6 rounded-full bg-[#121212] border border-white/10 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </section>
    );
}

function InterviewShowcase() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const features = [
        { label: "AI Voice", position: { top: "8%", left: "5%" }, color: "#3B82F6" },
        { label: "Code Editor", position: { top: "15%", right: "5%" }, color: "#10B981" },
        { label: "Whiteboard", position: { bottom: "35%", left: "5%" }, color: "#8B5CF6" },
        { label: "Test Cases", position: { bottom: "10%", right: "10%" }, color: "#F59E0B" },
    ];

    return (
        <section ref={ref} className="px-6 py-24">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-header-font text-4xl md:text-5xl text-white text-center mb-4"
            >
                EVERYTHING YOU NEED
            </motion.h2>
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-nav-font text-neutral-500 text-center mb-16 text-sm max-w-xl mx-auto"
            >
                A complete interview environment with all the tools you'd get in a real FAANG interview
            </motion.p>

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative max-w-5xl mx-auto aspect-16/10 rounded-2xl overflow-hidden"
            >
                <div className="absolute inset-0 bg-linear-to-br from-[#1a1a1a] via-[#161616] to-[#121212] border border-white/10 rounded-2xl" />

                <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 gap-3">
                    <div className="col-span-1 row-span-2 bg-[#1e1e1e] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-b from-blue-500/5 to-transparent" />
                        <span className="text-white/30 font-nav-font text-xs">Question Panel</span>
                    </div>
                    <div className="col-span-2 row-span-2 bg-[#1e1e1e] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-r from-green-500/5 to-transparent" />
                        <span className="text-white/30 font-nav-font text-xs">Code Editor / Whiteboard</span>
                    </div>
                    <div className="col-span-1 row-span-1 bg-[#1e1e1e] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-t from-purple-500/5 to-transparent" />
                        <span className="text-white/30 font-nav-font text-xs">Audio Wave</span>
                    </div>
                    <div className="col-span-2 row-span-1 bg-[#1e1e1e] rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-linear-to-t from-amber-500/5 to-transparent" />
                        <span className="text-white/30 font-nav-font text-xs">Test Cases</span>
                    </div>
                </div>

                {features.map((feature, index) => (
                    <motion.div
                        key={feature.label}
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={isInView ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
                        transition={{ duration: 0.5, delay: 0.4 + index * 0.15 }}
                        style={{ ...feature.position }}
                        className="absolute"
                    >
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm"
                            style={{
                                backgroundColor: `${feature.color}15`,
                                borderColor: `${feature.color}40`,
                            }}
                        >
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: feature.color }} />
                            <span className="font-btn-font text-xs" style={{ color: feature.color }}>{feature.label}</span>
                        </div>
                    </motion.div>
                ))}
            </motion.div>
        </section>
    );
}

function StatsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const stats = [
        { value: "500+", label: "Interview Questions" },
        { value: "24/7", label: "Available Anytime" },
        { value: "Real-time", label: "AI Feedback" },
    ];

    return (
        <section ref={ref} className="px-6 py-20">
            <div className="flex flex-wrap justify-center gap-12 md:gap-20">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="text-center"
                    >
                        <p className="font-header-font text-5xl md:text-6xl text-white mb-2">{stat.value}</p>
                        <p className="font-nav-font text-neutral-500 text-sm">{stat.label}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

function TestimonialsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    const testimonials = [
        {
            quote: "Practicing with Signal helped me land my dream job at Google. The AI feedback was incredibly detailed.",
            name: "Coming Soon",
            role: "Software Engineer",
            accent: "#3B82F6",
        },
        {
            quote: "The behavioral interview practice was game-changing. I felt so much more confident in my actual interviews.",
            name: "Coming Soon",
            role: "Product Manager",
            accent: "#10B981",
        },
        {
            quote: "Best interview prep tool I've used. The real FAANG questions make all the difference.",
            name: "Coming Soon",
            role: "Senior Developer",
            accent: "#F59E0B",
        },
    ];

    return (
        <section ref={ref} className="px-6 py-24">
            <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="font-header-font text-4xl md:text-5xl text-white text-center mb-4"
            >
                SUCCESS STORIES
            </motion.h2>
            <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-nav-font text-neutral-500 text-center mb-16 text-sm"
            >
                Join thousands who landed their dream jobs
            </motion.p>

            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {testimonials.map((testimonial, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 40 }}
                        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                        transition={{ duration: 0.7, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="group relative"
                    >
                        <div
                            className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"
                            style={{ background: `linear-gradient(135deg, ${testimonial.accent}30, transparent)` }}
                        />
                        <div className="relative bg-[#161616] border border-white/5 hover:border-white/10 rounded-2xl p-8 transition-all duration-300">
                            <div className="flex gap-1 mb-6">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className="w-4 h-4" fill={testimonial.accent} viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>
                            <p className="font-nav-font text-neutral-300 text-sm leading-relaxed mb-8">
                                "{testimonial.quote}"
                            </p>
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: `${testimonial.accent}15` }}
                                >
                                    <span className="font-btn-font text-lg" style={{ color: testimonial.accent }}>
                                        {testimonial.name[0]}
                                    </span>
                                </div>
                                <div>
                                    <p className="font-btn-font text-white text-sm">{testimonial.name}</p>
                                    <p className="font-nav-font text-neutral-500 text-xs">{testimonial.role}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

function FinalCTA() {
    const navigate = useNavigate();
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section ref={ref} className="px-6 py-24">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative max-w-4xl mx-auto text-center overflow-hidden rounded-3xl"
            >
                <div className="absolute inset-0 bg-linear-to-b from-[#1a1a1a] via-[#161616] to-[#121212]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
                <div className="absolute inset-px rounded-3xl border border-white/10" />

                <div className="relative p-12 md:p-20">
                    <h2 className="font-header-font text-4xl md:text-6xl text-white mb-6">
                        READY TO ACE YOUR INTERVIEW?
                    </h2>
                    <p className="font-nav-font text-neutral-400 text-lg mb-10 max-w-xl mx-auto">
                        Start practicing with AI-powered mock interviews and get the feedback you need to land your dream job.
                    </p>
                    <button
                        onClick={() => navigate("/interview")}
                        className="group relative font-btn-font px-10 py-6 text-lg cursor-pointer overflow-hidden bg-white text-black rounded-full transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-105"
                    >
                        <span className="relative z-10 flex items-center gap-3">
                            Start Your Interview
                            <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </span>
                    </button>
                </div>
            </motion.div>
        </section>
    );
}

function Footer() {
    return (
        <footer className="px-6 py-12 mt-8">
            <div className="max-w-6xl mx-auto">
                <div className="h-px w-full bg-linear-to-r from-transparent via-white/10 to-transparent mb-12" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <span className="font-header-font text-xl text-white">SIGNAL</span>
                    </div>
                    <div className="flex gap-8">
                        <a href="/interview" className="font-nav-font text-neutral-500 text-sm hover:text-white transition">Interview</a>
                        <a href="/leaderboard" className="font-nav-font text-neutral-500 text-sm hover:text-white transition">Leaderboard</a>
                        <a href="/login" className="font-nav-font text-neutral-500 text-sm hover:text-white transition">Sign In</a>
                    </div>
                    <p className="font-nav-font text-neutral-600 text-xs">
                        © 2025 Signal. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
