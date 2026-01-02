import { useState, useEffect } from 'react';

export default function InterpretingIndicator() {
    const [dots, setDots] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setDots((prev) => (prev % 3) + 1);
        }, 400);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-(--cyber-cyan) animate-pulse" />
            <span className="text-(--cyber-cyan) font-nav-font text-xs">
                Interpreting whiteboard{'.'.repeat(dots)}
            </span>
        </div>
    );
}

