import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

type AudioWaveProps = {
    stream: MediaStream | null;
    agent: boolean;
    current_agent?: string;
    isLoaded: boolean;
    setIsLoaded: Dispatch<SetStateAction<boolean>>;
    compact?: boolean;
}

export function AudioWave({ stream, agent, isLoaded, setIsLoaded, current_agent, compact = false }: AudioWaveProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!stream || !canvasRef.current) return;

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();

        analyser.fftSize = 2048;
        source.connect(analyser);

        analyserRef.current = analyser;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d")!;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const primaryColor = agent ? "#00ffcc" : "#ffb800";
        const secondaryColor = agent ? "rgba(0, 255, 204, 0.3)" : "rgba(255, 184, 0, 0.3)";

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
                sum += Math.abs(dataArray[i] - 128);
            }
            const avgAmplitude = sum / bufferLength;
            setIsActive(avgAmplitude > 5);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, secondaryColor);
            gradient.addColorStop(0.5, primaryColor);
            gradient.addColorStop(1, secondaryColor);

            ctx.lineWidth = 2;
            ctx.strokeStyle = gradient;
            ctx.shadowBlur = isActive ? 15 : 5;
            ctx.shadowColor = primaryColor;
            ctx.beginPath();

            const sliceWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * canvas.height) / 2;

                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);

                x += sliceWidth;
            }

            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        };

        draw();

        if (agent) {
            setIsLoaded(true)
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            analyser.disconnect();
            source.disconnect();
            audioCtx.close();
        };
    }, [stream]);

    const containerClass = agent ? 'agent' : 'user';
    const activeClass = isActive ? 'active' : '';
    const label = agent ? 'AI Interviewer' : 'You';
    const labelColor = agent ? 'text-[var(--cyber-cyan)]' : 'text-[var(--cyber-amber)]';
    
    const canvasWidth = compact ? 200 : (current_agent !== "Problem Interviewer" ? 400 : 220);
    const canvasHeight = compact ? 40 : 50;

    return (
        <div className={`wave-container ${containerClass} ${activeClass}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`font-btn-font text-xs uppercase tracking-wider ${labelColor}`}>
                    {label}
                </span>
                {isActive && (
                    <span className={`w-2 h-2 rounded-full ${agent ? 'bg-[var(--cyber-cyan)]' : 'bg-[var(--cyber-amber)]'} animate-pulse-glow`} />
                )}
            </div>
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    style={{ opacity: isLoaded ? '1' : '0' }}
                    width={canvasWidth}
                    height={canvasHeight}
                    className="block"
                />
                {(agent && !isLoaded) && (
                    <p className="text-white/60 text-sm font-nav-font absolute inset-0 flex items-center justify-center">
                        Connecting...
                    </p>
                )}
            </div>
        </div>
    );
}
