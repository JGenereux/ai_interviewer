import { getFeedbackSteps, splitFeedbackIntoSteps, type FeedbackStep, type FeedbackStepData, type InterviewFeedback } from "@/types/interview";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/contexts/authContext";
import { useNavigate } from "react-router-dom";

export default function DisplayFeedback({ feedback, xpGained }: { feedback: InterviewFeedback; xpGained: number | null }) {
    const navigate = useNavigate();
    const availableSteps = getFeedbackSteps(feedback);
    const [currentStep, setCurrentStep] = useState<FeedbackStep>(availableSteps[0]);

    const stepData = splitFeedbackIntoSteps(feedback);
    const isLoading = xpGained === null;

    const renderStep = () => {
        switch (currentStep) {
            case 'summary':
                return <SummaryStep data={stepData} xpGained={xpGained ?? 0} />;
            case 'technical':
                return stepData.technical ? <TechnicalStep data={stepData} /> : null;
            case 'behavioral':
                return stepData.behavioral ? <BehavioralStep data={stepData} /> : null;
            case 'next_steps':
                return <NextStepsStep data={stepData} />;
        }
    };

    const nextStep = () => {
        const currentIndex = availableSteps.indexOf(currentStep);
        if (currentIndex < availableSteps.length - 1) {
            setCurrentStep(availableSteps[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const currentIndex = availableSteps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(availableSteps[currentIndex - 1]);
        }
    };

    if (isLoading) {
        return (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center my-auto mx-auto w-3/6 h-5/6 bg-[#181818] border-0 rounded-lg p-6"
            >
                <div className="flex flex-col items-center gap-6">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-2 border-[#33ff33]/20 rounded-full" />
                        <div className="absolute inset-0 border-2 border-transparent border-t-[#33ff33] rounded-full animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="font-nav-font text-sm text-[#33ff33]/80 uppercase tracking-widest">Processing Results</p>
                        <p className="font-nav-font text-xs text-white/40 mt-2">Calculating your XP...</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return <motion.div variants={{
        visible: {
            transition: {
                staggerChildren: 0.3
            }
        }
    }} className="flex flex-col my-auto mx-auto w-3/6 h-5/6 bg-[#181818] border-0 rounded-lg p-6">
        <div className="flex justify-center gap-2 mb-8">
            {availableSteps.map((step, index) => (
                <div
                    key={step}
                    className={`h-2 w-2 rounded-full transition-all ${index === availableSteps.indexOf(currentStep)
                        ? 'bg-blue-500 w-8'
                        : index < availableSteps.indexOf(currentStep)
                            ? 'bg-blue-700'
                            : 'bg-gray-700'
                        }`}
                />
            ))}
        </div>
        <h3 className="text-center text-white font-label-font font-bold text-3xl mb-6">Your Interview Feedback</h3>
        <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
                {renderStep()}
            </AnimatePresence>
        </div>
        <div className="flex flex-row justify-center gap-4 mt-6">
            <Button onClick={() => navigate('/interview')} className="bg-transparent text-white/50 hover:text-white hover:bg-white/5 cursor-pointer font-btn-font px-6 border border-white/20">Skip</Button>
            <Button onClick={() => prevStep()} className="bg-white text-black hover:bg-white cursor-pointer font-btn-font px-6">Back</Button>
            <Button onClick={() => nextStep()} className="bg-white text-black hover:bg-white cursor-pointer font-btn-font px-6">Continue</Button>

        </div>
    </motion.div>;
}

function SummaryStep({ data, xpGained }: { data: FeedbackStepData; xpGained: number }) {
    const summary = data.summary
    const { xp: currentXp } = useAuth();
    const [animatedXp, setAnimatedXp] = useState(0);
    const [showBar, setShowBar] = useState(false);

    const previousXp = currentXp - xpGained;
    const level = Math.floor(currentXp / 500) + 1;
    const previousLevel = Math.floor(previousXp / 500) + 1;
    const xpForCurrentLevel = (level - 1) * 500;
    const xpForNextLevel = level * 500;
    const previousProgress = Math.max(0, ((previousXp - xpForCurrentLevel) / 500) * 100);
    const currentProgress = ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    useEffect(() => {
        if (xpGained > 0) {
            const timer = setTimeout(() => setShowBar(true), 500);
            return () => clearTimeout(timer);
        }
    }, [xpGained]);

    useEffect(() => {
        if (showBar && xpGained > 0) {
            let start = 0;
            const duration = 1500;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 3);
                setAnimatedXp(Math.round(eased * xpGained));
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        }
    }, [showBar, xpGained]);

    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2">
        <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.75
                    }
                }
            }}
        >
            {xpGained > 0 && (
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: -20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    transition={{ duration: 0.5 }}
                    className="relative mb-4 w-full max-w-sm mx-auto"
                >
                    <div className="relative overflow-hidden rounded border border-[#33ff33]/30 bg-[#0a0a0a] p-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#33ff33] animate-pulse" />
                                <span className="font-nav-font text-[10px] text-[#33ff33]/70 uppercase tracking-widest">XP</span>
                            </div>
                            <motion.span 
                                className="font-header-font text-2xl text-[#33ff33] drop-shadow-[0_0_10px_rgba(51,255,51,0.5)]"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                            >
                                +{animatedXp}
                            </motion.span>
                        </div>

                        <div className="relative h-4 rounded-sm bg-[#0d0d0d] border border-[#33ff33]/20 overflow-hidden">
                            <motion.div
                                className="absolute inset-y-0 left-0"
                                initial={{ width: `${previousProgress}%` }}
                                animate={showBar ? { width: `${currentProgress}%` } : {}}
                                transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                            >
                                <div 
                                    className="h-full bg-[#33ff33]"
                                    style={{
                                        backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.3) 4px, rgba(0,0,0,0.3) 8px)`,
                                        boxShadow: '0 0 12px rgba(51, 255, 51, 0.4)'
                                    }}
                                />
                            </motion.div>
                        </div>

                        <div className="flex justify-between mt-1 text-[10px] font-nav-font text-[#33ff33]/50">
                            <span>LVL {level}</span>
                            <span>{currentXp.toLocaleString()} / {xpForNextLevel.toLocaleString()}</span>
                        </div>

                        {level > previousLevel && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 2, type: "spring" }}
                                className="absolute -top-2 -right-2 px-2 py-0.5 bg-[#33ff33] text-black font-btn-font text-[10px] rounded transform rotate-12"
                            >
                                LVL UP
                            </motion.div>
                        )}

                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#33ff33]/50" />
                        <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[#33ff33]/50" />
                        <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-[#33ff33]/50" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#33ff33]/50" />
                    </div>
                </motion.div>
            )}
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-xl">OVERALL SCORE</span>
                <span className="font-nav-font font-semi-bold">{summary.overallScore}/10</span>
            </motion.div>
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-xl">WOULD HIRE?</span>
                <span className="font-nav-font font-semi-bold">{summary.hireRecommendation}</span>
            </motion.div>
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-xl">OVERALL SUMMARY</span>
                <span className="font-nav-font font-semi-bold w-[90%] line-clamp-3">{summary.overallSummary}</span>
            </motion.div>
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-xl">STRENGTHS</span>
                {summary.keyStrengths?.slice(0, 3)?.map((strength, i) =>
                    <span key={i} className="font-nav-font font-semi-bold w-[90%] line-clamp-1">-{strength}</span>
                )}
            </motion.div>
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-xl">WEAKNESSES</span>
                {summary.keyWeaknesses?.slice(0, 3)?.map((weakness, i) =>
                    <span key={i} className="font-nav-font font-semi-bold w-[90%] line-clamp-1">-{weakness}</span>
                )}
            </motion.div>
        </motion.div>
    </motion.div>
}

function TechnicalStep({ data }: { data: FeedbackStepData }) {
    const technical = data.technical
    if (!technical) return null;
    
    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2 h-full overflow-y-auto cyber-scrollbar">
        <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.75
                    }
                }
            }}
        >
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">TECHNICAL SCORE</span>
                <span className="font-nav-font font-semi-bold text-2xl">{technical.score}/10</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">PROBLEM SOLVING</span>
                <span className="font-nav-font font-semi-bold text-center w-[95%] line-clamp-1">{technical.problemSolvingApproach.feedback}</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">CODE QUALITY</span>
                <span className="font-nav-font font-semi-bold text-center w-[95%] line-clamp-1">{technical.codeQuality.feedback}</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">COMPLEXITY</span>
                <div className="flex flex-row gap-3 justify-center w-full">
                    <span className="font-nav-font font-semi-bold">T: {technical.complexity?.timeComplexity || 'Unknown'}</span>
                    <span className="font-nav-font font-semi-bold">S: {technical.complexity?.spaceComplexity || 'Unknown'}</span>
                    <span className="font-nav-font font-semi-bold">{technical.complexity?.optimalSolution ? '✓' : '✗'}</span>
                </div>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">HIGHLIGHTS</span>
                {technical.highlights?.slice(0, 2)?.map((highlight, i) =>
                    <span key={i} className="font-nav-font font-semi-bold w-[95%] line-clamp-1 text-sm">• {highlight}</span>
                )}
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">IMPROVEMENTS</span>
                {technical.areasForImprovement?.slice(0, 2)?.map((area, i) =>
                    <span key={i} className="font-nav-font font-semi-bold w-[95%] line-clamp-1 text-sm">• {area}</span>
                )}
            </motion.div>
        </motion.div>
    </motion.div>
}

function BehavioralStep({ data }: { data: FeedbackStepData }) {
    const behavioral = data.behavioral
    if (!behavioral) return null;
    
    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2 h-full overflow-y-auto cyber-scrollbar">
        <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.75
                    }
                }
            }}
        >
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">BEHAVIORAL SCORE</span>
                <span className="font-nav-font font-semi-bold text-2xl">{behavioral.score}/10</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">COMMUNICATION</span>
                <span className="font-nav-font font-semi-bold text-center w-[95%] line-clamp-2">{behavioral.overallCommunication.feedback}</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">CULTURAL FIT</span>
                <span className="font-nav-font font-semi-bold text-center w-[95%] line-clamp-1">Rating: {behavioral.culturalFit.rating}/5</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">HIGHLIGHTS</span>
                {behavioral.highlights?.slice(0, 2)?.map((highlight, i) =>
                    <span key={i} className="font-nav-font font-semi-bold w-[95%] line-clamp-1 text-sm">• {highlight}</span>
                )}
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">IMPROVEMENTS</span>
                {behavioral.areasForImprovement?.slice(0, 2)?.map((area, i) =>
                    <span key={i} className="font-nav-font font-semi-bold w-[95%] line-clamp-1 text-sm">• {area}</span>
                )}
            </motion.div>
        </motion.div>
    </motion.div>
}

function NextStepsStep({ data }: { data: FeedbackStepData }) {
    const nextSteps = data.next_steps
    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2 h-full overflow-y-auto cyber-scrollbar">
        <motion.div
            className="flex flex-col gap-2"
            initial="hidden"
            animate="visible"
            variants={{
                hidden: {},
                visible: {
                    transition: {
                        staggerChildren: 0.75
                    }
                }
            }}
        >
            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">READY FOR ROLE?</span>
                <span className={`font-nav-font font-semi-bold text-2xl ${nextSteps.readyForRole ? 'text-green-400' : 'text-red-400'}`}>
                    {nextSteps.readyForRole ? 'YES' : 'NOT YET'}
                </span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">NEXT STEPS</span>
                <span className="font-nav-font font-semi-bold text-center w-[95%] line-clamp-3">{nextSteps.suggestedNextSteps}</span>
            </motion.div>

            <motion.div
                variants={{
                    hidden: { opacity: 0, scale: 0 },
                    visible: { opacity: 1, scale: 1 }
                }}
                transition={{ duration: 0.8 }}
                className="flex flex-col items-center"
            >
                <span className="font-btn-font text-lg">RECOMMENDATIONS</span>
                {nextSteps.recommendations?.slice(0, 3)?.map((rec, i) => (
                    <div key={i} className="flex flex-col items-center w-[95%] mb-2">
                        <span className="font-nav-font font-semi-bold text-sm line-clamp-1">{rec.area}</span>
                        <span className="font-nav-font text-xs text-center line-clamp-2 opacity-80">{rec.suggestion}</span>
                        <span className={`text-xs font-bold ${rec.priority === 'high' ? 'text-red-400' : rec.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'}`}>
                            {rec.priority.toUpperCase()}
                        </span>
                    </div>
                ))}
            </motion.div>

            {nextSteps.additionalComments && (
                <motion.div
                    variants={{
                        hidden: { opacity: 0, scale: 0 },
                        visible: { opacity: 1, scale: 1 }
                    }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center"
                >
                    <span className="font-btn-font text-lg">ADDITIONAL NOTES</span>
                    <span className="font-nav-font font-semi-bold text-center w-[95%] line-clamp-2 text-sm">{nextSteps.additionalComments}</span>
                </motion.div>
            )}
        </motion.div>
    </motion.div>
}   
