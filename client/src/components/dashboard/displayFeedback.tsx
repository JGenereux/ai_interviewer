import { FEEDBACK_STEPS, splitFeedbackIntoSteps, type FeedbackStep, type FeedbackStepData, type InterviewFeedback } from "@/types/interview";
import { useState } from "react";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";

export default function DisplayFeedback({ feedback }: { feedback: InterviewFeedback }) {
    const [currentStep, setCurrentStep] = useState<FeedbackStep>('summary');

    const stepData = splitFeedbackIntoSteps(feedback);

    // Render based on currentStep
    const renderStep = () => {
        switch (currentStep) {
            case 'summary':
                return <SummaryStep data={stepData} />;
            case 'technical':
                return <TechnicalStep data={stepData} />;
            case 'behavioral':
                return <BehavioralStep data={stepData} />;
            case 'next_steps':
                return <NextStepsStep data={stepData} />;
        }
    };

    // Navigation
    const nextStep = () => {
        const currentIndex = FEEDBACK_STEPS.indexOf(currentStep);
        if (currentIndex < FEEDBACK_STEPS.length - 1) {
            setCurrentStep(FEEDBACK_STEPS[currentIndex + 1]);
        }
    };

    const prevStep = () => {
        const currentIndex = FEEDBACK_STEPS.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(FEEDBACK_STEPS[currentIndex - 1]);
        }
    };

    return <motion.div variants={{
        visible: {
            transition: {
                staggerChildren: 0.3
            }
        }
    }} className="flex flex-col my-auto mx-auto w-3/6 h-5/6 bg-[#181818] border-0 rounded-lg p-6">
        <div className="flex justify-center gap-2 mb-8">
            {FEEDBACK_STEPS.map((step, index) => (
                <div
                    key={step}
                    className={`h-2 w-2 rounded-full transition-all ${index === FEEDBACK_STEPS.indexOf(currentStep)
                        ? 'bg-blue-500 w-8'
                        : index < FEEDBACK_STEPS.indexOf(currentStep)
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
            <Button className="bg-white text-black hover:bg-white cursor-pointer font-btn-font px-6">Don't Care</Button>
            <Button onClick={() => nextStep()} className="bg-white text-black hover:bg-white cursor-pointer font-btn-font px-6">Continue</Button>
        </div>
    </motion.div>;
}

function SummaryStep({ data }: { data: FeedbackStepData }) {
    const summary = data.summary
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
    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2 h-full overflow-y-auto">
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
                    <span className="font-nav-font font-semi-bold">T:{technical.complexity.timeComplexity}</span>
                    <span className="font-nav-font font-semi-bold">S:{technical.complexity.spaceComplexity}</span>
                    <span className="font-nav-font font-semi-bold">{technical.complexity.optimalSolution ? '✓' : '✗'}</span>
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
    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2 h-full overflow-y-auto">
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
    return <motion.div exit={{ opacity: 0, scale: 0 }} transition={{ duration: 0.3 }} className="flex flex-col text-white gap-2 h-full overflow-y-auto">
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