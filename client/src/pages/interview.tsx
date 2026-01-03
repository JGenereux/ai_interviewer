import Navbar from "@/components/navbar";
import Dashboard from "@/components/dashboard";
import { useOnboarding } from "@/contexts/onboardingContext";
import { useAuth } from "@/contexts/authContext";
import { useEffect } from "react";

export default function Interview() {
    const { id, tourCompleted } = useAuth();
    const { startTour, isActive } = useOnboarding();

    useEffect(() => {
        if (id && !tourCompleted && !isActive) {
            const timer = setTimeout(() => {
                startTour();
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [id, tourCompleted, isActive, startTour]);

    return <div className="flex flex-col h-screen">
        <Navbar />
        <Dashboard />
    </div>
}