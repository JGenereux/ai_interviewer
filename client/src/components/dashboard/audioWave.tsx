import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";


export function AudioWave({ stream, agent, isLoaded, setIsLoaded }: { stream: MediaStream | null, agent: boolean, isLoaded: boolean, setIsLoaded: Dispatch<SetStateAction<boolean>> }) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const rafRef = useRef<number>(0);

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

        const draw = () => {
            rafRef.current = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 2;
            ctx.strokeStyle = agent ? "#0000ff" : "#800080";
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

    return (
        <WaveAxis>
            <div className="">
                <canvas
                    ref={canvasRef}
                    style={{ opacity: isLoaded ? '100' : '0' }}
                    width={600}
                    height={50}
                />
                {(agent && !isLoaded) && <p className="text-white text-xl w-[600px] text-center">Starting your interview!</p>}
            </div>
        </WaveAxis>
    );
}

const WaveAxis = ({ children }: { children: React.ReactNode }) => (
    <div className="w-full flex justify-center">
        <div className="w-[600px] flex justify-center">
            {children}
        </div>
    </div>
);