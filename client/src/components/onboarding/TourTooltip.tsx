import { useEffect, useState, useRef } from "react";
import { motion } from "motion/react";
import { useOnboarding } from "@/contexts/onboardingContext";
import type { TourStep } from "@/contexts/onboardingContext";

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

interface TourTooltipProps {
    step: TourStep;
    targetRect: TargetRect;
    stepNumber: number;
    totalSteps: number;
}

type Position = {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    transform?: string;
};

export default function TourTooltip({ step, targetRect, stepNumber, totalSteps }: TourTooltipProps) {
    const { nextStep, prevStep, skipTour } = useOnboarding();
    const [position, setPosition] = useState<Position>({});
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!tooltipRef.current) return;

        const tooltipRect = tooltipRef.current.getBoundingClientRect();
        const padding = 12;
        const viewportWidth = window.innerWidth;

        let newPosition: Position = {};

        switch (step.position) {
            case 'bottom':
                newPosition = {
                    top: targetRect.top + targetRect.height + padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
                break;
            case 'bottom-end':
                newPosition = {
                    top: targetRect.top + targetRect.height + padding,
                    left: targetRect.left + targetRect.width,
                    transform: 'translateX(-100%)'
                };
                break;
            case 'bottom-start':
                newPosition = {
                    top: targetRect.top + targetRect.height + padding,
                    left: targetRect.left
                };
                break;
            case 'top':
                newPosition = {
                    top: targetRect.top - tooltipRect.height - padding,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
                break;
            case 'left':
                newPosition = {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left - tooltipRect.width - padding,
                    transform: 'translateY(-50%)'
                };
                break;
            case 'right':
                newPosition = {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left + targetRect.width + padding,
                    transform: 'translateY(-50%)'
                };
                break;
        }

        if (newPosition.left !== undefined) {
            const tooltipWidth = tooltipRect.width;
            if (newPosition.left < padding) {
                newPosition.left = padding;
                newPosition.transform = undefined;
            } else if (newPosition.left + tooltipWidth > viewportWidth - padding) {
                newPosition.left = viewportWidth - tooltipWidth - padding;
                newPosition.transform = undefined;
            }
        }

        if (newPosition.top !== undefined && newPosition.top < padding) {
            newPosition.top = targetRect.top + targetRect.height + padding;
        }

        setPosition(newPosition);
    }, [step.position, targetRect]);

    const isLastStep = stepNumber === totalSteps - 1;
    const isFirstStep = stepNumber === 1;

    return (
        <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-10000 w-80 pointer-events-auto"
            style={{
                top: position.top,
                left: position.left,
                transform: position.transform
            }}
        >
            <div className="bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                <div className="px-4 py-2 border-b border-white/10 bg-white/5">
                    <div className="flex items-center justify-between">
                        <span className="font-nav-font text-xs text-white/40">
                            Step {stepNumber} of {totalSteps - 1}
                        </span>
                        <div className="flex gap-1">
                            {Array.from({ length: totalSteps - 1 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-colors ${i < stepNumber ? 'bg-[--cyber-cyan]' : 'bg-white/20'
                                        }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-[--cyber-cyan]/10">
                            <TourIcon stepId={step.id} />
                        </div>
                        <div>
                            <h3 className="font-header-font text-lg text-white mb-1">
                                {step.title}
                            </h3>
                            <p className="font-nav-font text-sm text-white/60 leading-relaxed">
                                {step.content}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between">
                    <button
                        onClick={skipTour}
                        className="font-btn-font text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                    >
                        Skip Tour
                    </button>
                    <div className="flex gap-2">
                        {!isFirstStep && (
                            <button
                                onClick={prevStep}
                                className="font-btn-font text-sm px-4 py-2 text-white/60 hover:text-white transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            className="font-btn-font text-sm px-4 py-2 bg-[--cyber-cyan] text-black rounded-lg hover:bg-[--cyber-cyan]/90 transition-colors cursor-pointer flex items-center gap-2"
                        >
                            {isLastStep ? 'Continue' : 'Next'}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function TourIcon({ stepId }: { stepId: string }) {
    switch (stepId) {
        case 'interview-link':
            return (
                <svg className="w-5 h-5 text-[--cyber-cyan]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
            );
        case 'mode-selector':
            return (
                <svg className="w-5 h-5 text-[--cyber-cyan]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            );
        case 'leaderboard-link':
            return (
                <svg className="w-5 h-5 text-[--cyber-cyan]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            );
        case 'profile-link':
            return (
                <svg className="w-5 h-5 text-[--cyber-cyan]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            );
        default:
            return (
                <svg className="w-5 h-5 text-[--cyber-cyan]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            );
    }
}

