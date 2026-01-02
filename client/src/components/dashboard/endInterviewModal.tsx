import { motion, AnimatePresence } from 'motion/react'

interface EndInterviewModalProps {
    isOpen: boolean
    onConfirm: () => void
    onCancel: () => void
}

export default function EndInterviewModal({ isOpen, onConfirm, onCancel }: EndInterviewModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onCancel}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="relative z-10 w-full max-w-md mx-4"
                    >
                        <div className="relative bg-(--cyber-bg-deep) border border-white/10 rounded-lg overflow-hidden">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-linear-to-b from-(--cyber-cyan)/5 to-transparent pointer-events-none" />

                            {/* Header */}
                            <div className="relative px-6 py-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-(--cyber-amber) animate-pulse" />
                                    <h2 className="text-white font-label-font text-lg font-semibold tracking-wide">
                                        END_INTERVIEW.exe
                                    </h2>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="relative px-6 py-6">
                                <p className="text-white/80 font-nav-font text-sm leading-relaxed">
                                    Are you sure you want to end this interview session?
                                    This action will disconnect the call and finalize your results.
                                </p>

                                <div className="mt-4 p-3 bg-black/30 rounded border border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-(--cyber-cyan) text-xs font-btn-font">STATUS:</span>
                                        <span className="text-(--cyber-amber) text-xs font-nav-font">AWAITING_CONFIRMATION</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="relative px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
                                <button
                                    onClick={onCancel}
                                    className="px-5 py-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-btn-font text-sm rounded border border-white/10 hover:border-white/20 transition-all"
                                >
                                    CANCEL
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className="px-5 py-2 bg-(--cyber-red)/20 hover:bg-(--cyber-red)/30 text-(--cyber-red) font-btn-font text-sm rounded border border-(--cyber-red)/30 hover:border-(--cyber-red)/50 transition-all"
                                >
                                    END INTERVIEW
                                </button>
                            </div>
                        </div>

                        {/* Decorative corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-(--cyber-cyan)/50 rounded-tl-lg" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-(--cyber-cyan)/50 rounded-tr-lg" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-(--cyber-cyan)/50 rounded-bl-lg" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-(--cyber-cyan)/50 rounded-br-lg" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

