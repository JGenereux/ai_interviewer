import { motion } from "motion/react";
import type { Dispatch, SetStateAction } from "react";

function chunkText(text: string, size: number) {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
        chunks.push(text.slice(i, i + size));
    }
    return chunks;
}

export default function GradualSpacing({
    text,
    setDisplayGradual,
    chunkSize = 2,
}: {
    text: string;
    setDisplayGradual: Dispatch<SetStateAction<string | null>>;
    chunkSize?: number;
}) {
    const chunks = chunkText(text, chunkSize);

    return (
        <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0 }}
            className="flex flex-row flex-wrap max-w-[500px] h-[400px] justify-center"
        >
            {chunks.map((chunk, i) => {
                const baseDelay = 0.06;          // global pacing
                const charFactor = 0.015;        // slows per chunk size
                const delay = i * baseDelay + chunk.length * charFactor;

                return (
                    <motion.p
                        key={`${text}-${i}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            duration: 0.18,             // longer = calmer
                            delay,
                            ease: "easeOut",
                        }}
                        onAnimationComplete={() =>
                            i === chunks.length - 1 && setDisplayGradual(null)
                        }
                        className="text-center font-bold tracking-wider text-lg text-white whitespace-pre"
                    >
                        {chunk}
                    </motion.p>
                );
            })}
        </motion.div>
    );
}