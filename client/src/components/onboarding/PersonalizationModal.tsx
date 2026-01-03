import { useState } from "react";
import { motion } from "motion/react";
import { useOnboarding } from "@/contexts/onboardingContext";
import type { UserPreferences } from "@/contexts/onboardingContext";

const TARGET_ROLES = [
    { value: 'faang', label: 'FAANG / Big Tech', icon: '🏢' },
    { value: 'startup', label: 'Startup', icon: '🚀' },
    { value: 'first-job', label: 'First Job', icon: '🎯' },
    { value: 'career-switch', label: 'Career Switch', icon: '🔄' }
];

const EXPERIENCE_LEVELS = [
    { value: 'student', label: 'Student / Bootcamp', icon: '📚' },
    { value: 'junior', label: 'Junior (0-2 years)', icon: '🌱' },
    { value: 'mid', label: 'Mid-level (2-5 years)', icon: '💼' },
    { value: 'senior', label: 'Senior (5+ years)', icon: '⭐' }
];

const INTERVIEW_GOALS = [
    { value: 'behavioral', label: 'Behavioral Prep', description: 'STAR method, leadership stories' },
    { value: 'technical', label: 'Technical Prep', description: 'Data structures, algorithms' },
    { value: 'full', label: 'Full Interview Practice', description: 'End-to-end mock interviews' },
    { value: 'confidence', label: 'Build Confidence', description: 'Get comfortable speaking' }
];

export default function PersonalizationModal() {
    const { completeTour, skipTour } = useOnboarding();
    const [preferences, setPreferences] = useState<Partial<UserPreferences>>({});
    const [currentSection, setCurrentSection] = useState(0);

    const handleComplete = async () => {
        await completeTour(preferences as UserPreferences);
    };

    const sections = [
        { key: 'targetRole', title: 'What are you preparing for?', options: TARGET_ROLES },
        { key: 'experienceLevel', title: 'What\'s your experience level?', options: EXPERIENCE_LEVELS },
        { key: 'interviewGoal', title: 'What\'s your main goal?', options: INTERVIEW_GOALS }
    ];

    const currentSectionData = sections[currentSection];
    const isLastSection = currentSection === sections.length - 1;
    const canProceed = preferences[currentSectionData.key as keyof UserPreferences];

    const handleSelect = (value: string) => {
        setPreferences(prev => ({
            ...prev,
            [currentSectionData.key]: value
        }));
    };

    const handleNext = () => {
        if (isLastSection) {
            handleComplete();
        } else {
            setCurrentSection(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentSection > 0) {
            setCurrentSection(prev => prev - 1);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3 }}
                className="w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[--cyber-cyan]/10 to-transparent">
                    <div className="flex items-center justify-between mb-2">
                        <span className="font-nav-font text-xs text-white/40">
                            Step {currentSection + 1} of {sections.length}
                        </span>
                        <div className="flex gap-1">
                            {sections.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-8 h-1 rounded-full transition-colors ${
                                        i <= currentSection ? 'bg-[--cyber-cyan]' : 'bg-white/20'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                    <h2 className="font-header-font text-2xl text-white">
                        {currentSectionData.title}
                    </h2>
                </div>

                <div className="p-6">
                    <motion.div
                        key={currentSection}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="grid gap-3"
                    >
                        {currentSectionData.options.map((option) => {
                            const isSelected = preferences[currentSectionData.key as keyof UserPreferences] === option.value;
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelect(option.value)}
                                    className={`group w-full p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                        isSelected
                                            ? 'border-[--cyber-cyan] bg-[--cyber-cyan]/10'
                                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {'icon' in option && (
                                            <span className="text-2xl">{option.icon}</span>
                                        )}
                                        <div className="flex-1">
                                            <p className={`font-btn-font text-sm ${isSelected ? 'text-[--cyber-cyan]' : 'text-white'}`}>
                                                {option.label}
                                            </p>
                                            {'description' in option && (
                                                <p className="font-nav-font text-xs text-white/50 mt-0.5">
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            isSelected ? 'border-[--cyber-cyan] bg-[--cyber-cyan]' : 'border-white/20'
                                        }`}>
                                            {isSelected && (
                                                <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </motion.div>
                </div>

                <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex items-center justify-between">
                    <button
                        onClick={skipTour}
                        className="font-btn-font text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                    >
                        Skip
                    </button>
                    <div className="flex gap-2">
                        {currentSection > 0 && (
                            <button
                                onClick={handleBack}
                                className="font-btn-font text-sm px-4 py-2 text-white/60 hover:text-white transition-colors cursor-pointer"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={handleNext}
                            disabled={!canProceed}
                            className={`font-btn-font text-sm px-6 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                                canProceed
                                    ? 'bg-[--cyber-cyan] text-black hover:bg-[--cyber-cyan]/90'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                        >
                            {isLastSection ? 'Get Started' : 'Continue'}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

