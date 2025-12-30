import { useEffect } from "react";
import { useStopwatch } from "react-timer-hook";

export default function StopWatch() {
    const {
        hours,
        seconds,
        minutes,
        start
    } = useStopwatch({ interval: 1000 });

    useEffect(() => {
        start()
    }, [])

    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
        <div className="led-display px-4 py-2 rounded-lg">
            <span className="text-[var(--cyber-cyan)] glow-cyan-text text-lg tracking-widest">
                {pad(hours)}:{pad(minutes)}:{pad(seconds)}
            </span>
        </div>
    );
}
