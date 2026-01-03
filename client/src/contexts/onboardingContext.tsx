import { createContext, useState, useContext, useCallback, useEffect } from "react";
import axios from "axios";
import dbClient from "@/utils/supabaseDB";

const API_URL = import.meta.env.VITE_API_URL;

export interface UserPreferences {
    targetRole: string;
    experienceLevel: string;
    interviewGoal: string;
}

export interface TourStep {
    id: string;
    target: string | null;
    title: string;
    content: string | null;
    position: 'top' | 'bottom' | 'left' | 'right' | 'bottom-end' | 'bottom-start';
    isModal?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
    {
        id: 'interview-link',
        target: '[data-tour="interview-link"]',
        title: 'Start Practicing',
        content: 'Begin your interview prep journey here. Practice anytime with our AI interviewer.',
        position: 'bottom'
    },
    {
        id: 'mode-selector',
        target: '[data-tour="mode-selector"]',
        title: 'Choose Your Focus',
        content: 'Select behavioral for soft skills, technical for coding, or full for the complete experience.',
        position: 'right'
    },
    {
        id: 'leaderboard-link',
        target: '[data-tour="leaderboard-link"]',
        title: 'Compete & Grow',
        content: 'Earn XP from interviews and climb the leaderboard. See how you rank against others.',
        position: 'bottom'
    },
    {
        id: 'profile-link',
        target: '[data-tour="profile-link"]',
        title: 'Track Progress',
        content: 'View your interview history, XP level, and manage your account.',
        position: 'bottom-end'
    },
    {
        id: 'personalization',
        target: null,
        title: 'Personalize Your Experience',
        content: null,
        position: 'bottom',
        isModal: true
    }
];

interface OnboardingState {
    tourCompleted: boolean;
    currentStep: number;
    isActive: boolean;
    preferences: UserPreferences | null;
}

interface OnboardingContextType extends OnboardingState {
    startTour: () => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    completeTour: (preferences?: UserPreferences) => Promise<void>;
    setTourCompleted: (completed: boolean) => void;
    currentTourStep: TourStep | null;
}

const OnboardingContext = createContext<OnboardingContextType>({
    tourCompleted: true,
    currentStep: 0,
    isActive: false,
    preferences: null,
    startTour: () => {},
    nextStep: () => {},
    prevStep: () => {},
    skipTour: () => {},
    completeTour: async () => {},
    setTourCompleted: () => {},
    currentTourStep: null
});

interface OnboardingProviderProps {
    children: React.ReactNode;
    userId: string | null;
    initialTourCompleted?: boolean;
}

export const OnboardingProvider = ({ children, userId, initialTourCompleted = true }: OnboardingProviderProps) => {
    const [state, setState] = useState<OnboardingState>({
        tourCompleted: initialTourCompleted,
        currentStep: 0,
        isActive: false,
        preferences: null
    });

    useEffect(() => {
        setState(prev => ({ ...prev, tourCompleted: initialTourCompleted }));
    }, [initialTourCompleted]);

    useEffect(() => {
        if (state.isActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [state.isActive]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!state.isActive) return;
            
            if (e.key === 'Escape') {
                skipTour();
            } else if (e.key === 'Enter' || e.key === ' ') {
                if (!TOUR_STEPS[state.currentStep]?.isModal) {
                    e.preventDefault();
                    nextStep();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.isActive, state.currentStep]);

    const startTour = useCallback(() => {
        setState(prev => ({
            ...prev,
            isActive: true,
            currentStep: 0
        }));
    }, []);

    const nextStep = useCallback(() => {
        setState(prev => {
            const nextStepIndex = prev.currentStep + 1;
            if (nextStepIndex >= TOUR_STEPS.length) {
                return prev;
            }
            return {
                ...prev,
                currentStep: nextStepIndex
            };
        });
    }, []);

    const prevStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(0, prev.currentStep - 1)
        }));
    }, []);

    const saveOnboardingData = async (tourCompleted: boolean, preferences?: UserPreferences) => {
        if (!userId) return;

        try {
            const { data: { session } } = await dbClient.auth.getSession();
            await axios.put(`${API_URL}/users/${userId}/onboarding`, {
                tourCompleted,
                targetRole: preferences?.targetRole || null,
                experienceLevel: preferences?.experienceLevel || null,
                interviewGoal: preferences?.interviewGoal || null
            }, {
                headers: { Authorization: `Bearer ${session?.access_token}` }
            });
        } catch (error) {
            console.error('Failed to save onboarding data:', error);
            localStorage.setItem(`tour_completed_${userId}`, String(tourCompleted));
        }
    };

    const skipTour = useCallback(async () => {
        setState(prev => ({
            ...prev,
            isActive: false,
            tourCompleted: true,
            currentStep: 0
        }));
        await saveOnboardingData(true);
    }, [userId]);

    const completeTour = useCallback(async (preferences?: UserPreferences) => {
        setState(prev => ({
            ...prev,
            isActive: false,
            tourCompleted: true,
            currentStep: 0,
            preferences: preferences || null
        }));
        await saveOnboardingData(true, preferences);
    }, [userId]);

    const setTourCompleted = useCallback((completed: boolean) => {
        setState(prev => ({ ...prev, tourCompleted: completed }));
    }, []);

    const currentTourStep = state.isActive ? TOUR_STEPS[state.currentStep] : null;

    return (
        <OnboardingContext.Provider value={{
            ...state,
            startTour,
            nextStep,
            prevStep,
            skipTour,
            completeTour,
            setTourCompleted,
            currentTourStep
        }}>
            {children}
        </OnboardingContext.Provider>
    );
};

export const useOnboarding = () => {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error("useOnboarding must be used within an OnboardingProvider");
    }
    return context;
};

