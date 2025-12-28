import { useEffect } from "react";
import { useStopwatch } from "react-timer-hook";

export default function StopWatch() {
    const {
        hours,
        totalSeconds,
        minutes,
        start
    } = useStopwatch({ interval: 20 });;

    useEffect(() => {
        start()
    }, [])

    return (
        <span>{hours}{minutes}.{totalSeconds}</span>
    );
}