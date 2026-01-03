import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useOnboarding, TOUR_STEPS } from "@/contexts/onboardingContext";
import TourTooltip from "./TourTooltip";
import PersonalizationModal from "./PersonalizationModal";

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
}

export default function TourOverlay() {
    const { isActive, currentStep, currentTourStep } = useOnboarding();
    const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive || !currentTourStep?.target) {
            setTargetRect(null);
            return;
        }

        const updateTargetRect = () => {
            const target = document.querySelector(currentTourStep.target!);
            if (target) {
                const rect = target.getBoundingClientRect();
                setTargetRect({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height
                });
            }
        };

        updateTargetRect();

        const handleResize = () => updateTargetRect();
        const handleScroll = () => updateTargetRect();

        window.addEventListener('resize', handleResize);
        window.addEventListener('scroll', handleScroll, true);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('scroll', handleScroll, true);
        };
    }, [isActive, currentTourStep, currentStep]);

    if (!isActive) return null;

    const isModalStep = currentTourStep?.isModal;
    const padding = 8;

    return createPortal(
        <AnimatePresence>
            {isActive && (
                <motion.div
                    ref={overlayRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 z-[9999]"
                    style={{ pointerEvents: 'auto' }}
                >
                    {!isModalStep && (
                        <svg
                            className="absolute inset-0 w-full h-full"
                            style={{ pointerEvents: 'none' }}
                        >
                            <defs>
                                <mask id="spotlight-mask">
                                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                                    {targetRect && (
                                        <motion.rect
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            x={targetRect.left - padding}
                                            y={targetRect.top - padding}
                                            width={targetRect.width + padding * 2}
                                            height={targetRect.height + padding * 2}
                                            rx="8"
                                            fill="black"
                                        />
                                    )}
                                </mask>
                            </defs>
                            <rect
                                x="0"
                                y="0"
                                width="100%"
                                height="100%"
                                fill="rgba(0, 0, 0, 0.75)"
                                mask="url(#spotlight-mask)"
                                style={{ pointerEvents: 'auto' }}
                            />
                        </svg>
                    )}

                    {isModalStep && (
                        <div className="absolute inset-0 bg-black/75" />
                    )}

                    {targetRect && !isModalStep && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="absolute pointer-events-none"
                            style={{
                                top: targetRect.top - padding,
                                left: targetRect.left - padding,
                                width: targetRect.width + padding * 2,
                                height: targetRect.height + padding * 2
                            }}
                        >
                            <div className="absolute inset-0 rounded-lg border-2 border-[--cyber-cyan] animate-pulse" />
                            <div className="absolute inset-0 rounded-lg shadow-[0_0_20px_rgba(0,255,255,0.3)]" />
                        </motion.div>
                    )}

                    {isModalStep ? (
                        <PersonalizationModal />
                    ) : (
                        currentTourStep && targetRect && (
                            <TourTooltip
                                step={currentTourStep}
                                targetRect={targetRect}
                                stepNumber={currentStep + 1}
                                totalSteps={TOUR_STEPS.length}
                            />
                        )
                    )}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}

