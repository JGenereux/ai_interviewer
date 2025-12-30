import { motion, AnimatePresence } from 'motion/react'

type AuthAlertProps = {
    message: string | null
    type: 'error' | 'success'
    onClose: () => void
}

export default function AuthAlert({ message, type, onClose }: AuthAlertProps) {
    return (
        <AnimatePresence>
            {message && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-start justify-center pt-32 backdrop-blur-[2px] bg-black/60"
                >
                    <motion.div
                        initial={{ opacity: 0, y: -30, scale: 0 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -30, scale: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative px-10 py-6 bg-[#181818] border border-white/5 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.45),0_1px_0_rgba(255,255,255,0.04)] max-w-sm w-full mx-4"
                    >
                        <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-xl ${type === 'error' ? 'bg-red-500/80' : 'bg-emerald-500/80'}`} />
                        
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-4 text-white/40 hover:text-white/80 transition-colors cursor-pointer font-btn-font text-sm"
                        >
                            ✕
                        </button>
                        
                        <div className="flex flex-col items-center gap-4 pt-2">
                            <span className={`font-btn-font text-sm tracking-wider ${type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                                {type === 'error' ? 'ERROR' : 'SUCCESS'}
                            </span>
                            
                            <p className="font-nav-font text-center text-white/90 text-sm leading-relaxed">
                                {message}
                            </p>
                            
                            <button
                                onClick={onClose}
                                className="mt-2 font-btn-font text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                            >
                                DISMISS
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
