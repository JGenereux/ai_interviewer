import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/authContext";
import axios from "axios";
import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PRICE_IDS = {
    starter: 'price_1Sk46dA001HlwyT5qIwsFCpH',
    pro: 'price_1Sk470A001HlwyT5VVokmv1M'
};

export default function Pricing() {
    const [searchParams] = useSearchParams();
    const { id: userId } = useAuth();
    const navigate = useNavigate();
    const isNewUser = searchParams.get('newUser') === 'true';
    const pendingPriceId = searchParams.get('priceId');
    const checkoutTriggered = useRef(false);

    const handleSubscribe = async (priceId: string) => {
        if (!userId) {
            navigate(`/login?redirect=/pricing&priceId=${priceId}`);
            return;
        }
        try {
            const response = await axios.post('http://localhost:3000/payment/create-checkout-session/subscription', {
                priceId,
                userId
            });
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Failed to create checkout session:', error);
        }
    };

    useEffect(() => {
        if (pendingPriceId && userId && !checkoutTriggered.current) {
            checkoutTriggered.current = true;
            handleSubscribe(pendingPriceId);
        }
    }, [pendingPriceId, userId]);

    return (
        <div className="flex flex-col min-h-screen main-bg">
            <Navbar />
            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 py-8 md:py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 md:mb-8"
                >
                    <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-5 py-2 md:py-2.5 rounded-full bg-gradient-to-r from-[#10B981]/20 to-[#3B82F6]/20 border border-[#10B981]/30">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
                        </div>
                        <span className="font-btn-font text-xs md:text-sm text-[#10B981]">1 FREE INTERVIEW</span>
                        <span className="font-nav-font text-neutral-400 text-xs md:text-sm hidden sm:inline">— Try it before you buy</span>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-center mb-8 md:mb-12"
                >
                    <h1 className="font-header-font text-3xl md:text-5xl lg:text-6xl text-white mb-3 md:mb-4">
                        CHOOSE YOUR PLAN
                    </h1>
                    <p className="font-nav-font text-neutral-400 text-sm md:text-lg max-w-xl mx-auto px-4">
                        Select the plan that fits your interview prep needs
                    </p>
                </motion.div>

                <div className="flex flex-col lg:flex-row items-stretch justify-center gap-4 md:gap-6 w-full max-w-6xl mb-8 md:mb-12 px-2">
                    <PricingCard
                        tier="Starter"
                        price="$20"
                        interviews={6}
                        accent="#3B82F6"
                        delay={0}
                        priceId={PRICE_IDS.starter}
                        onSubscribe={handleSubscribe}
                        perks={[
                            "6 AI mock interviews",
                            "Behavioral + Technical rounds",
                            "Detailed feedback reports",
                            "Code execution environment"
                        ]}
                    />
                    <PricingCard
                        tier="Pro"
                        price="$50"
                        interviews={15}
                        accent="#10B981"
                        delay={0.1}
                        popular
                        priceId={PRICE_IDS.pro}
                        onSubscribe={handleSubscribe}
                        perks={[
                            "15 AI mock interviews",
                            "Behavioral + Technical rounds",
                            "Detailed feedback reports",
                            "Code execution environment",
                            "Priority question queue",
                            "Performance dashboard"
                        ]}
                    />
                    <PricingCard
                        tier="Enterprise"
                        price="Contact Sales"
                        interviews={null}
                        accent="#F59E0B"
                        delay={0.2}
                        perks={[
                            "Unlimited interviews",
                            "Custom question sets",
                            "Team management dashboard",
                            "Dedicated support",
                            "API access",
                            "Custom integrations"
                        ]}
                    />
                </div>

                {isNewUser && <GoToInterviewButton />}
            </div>
        </div>
    );
}

function PricingCard({
    tier,
    price,
    interviews,
    accent,
    delay,
    popular,
    perks,
    priceId,
    onSubscribe
}: {
    tier: string;
    price: string;
    interviews: number | null;
    accent: string;
    delay: number;
    popular?: boolean;
    perks: string[];
    priceId?: string;
    onSubscribe?: (priceId: string) => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
            className="group relative flex-1 max-w-sm w-full mx-auto lg:mx-0"
        >
            {popular && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-btn-font z-10"
                    style={{ backgroundColor: accent, color: '#000' }}
                >
                    MOST POPULAR
                </div>
            )}
            <div
                className="absolute -inset-px rounded-2xl opacity-0 blur-sm transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `linear-gradient(135deg, ${accent}40, transparent)` }}
            />
            <div
                className={`relative h-full p-5 md:p-8 rounded-2xl bg-[#161616] border transition-all duration-500 flex flex-col ${popular ? 'border-white/20' : 'border-white/10'
                    } hover:border-white/20`}
                style={popular ? { boxShadow: `0 0 40px ${accent}15` } : {}}
            >
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                    <div
                        className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full"
                        style={{ backgroundColor: accent }}
                    />
                    <span
                        className="font-btn-font text-xs md:text-sm uppercase tracking-wider"
                        style={{ color: accent }}
                    >
                        {tier}
                    </span>
                </div>

                <div className="mb-4 md:mb-6">
                    {interviews !== null ? (
                        <>
                            <span className="font-header-font text-3xl md:text-5xl text-white">{price}</span>
                            <span className="font-nav-font text-neutral-500 text-xs md:text-sm ml-1 md:ml-2">/mo</span>
                        </>
                    ) : (
                        <span className="font-header-font text-xl md:text-3xl text-white">{price}</span>
                    )}
                </div>

                <div className="mb-4 md:mb-6">
                    {interviews !== null ? (
                        <p className="font-nav-font text-neutral-300 text-sm md:text-base">
                            <span className="text-xl md:text-2xl font-btn-font" style={{ color: accent }}>{interviews}</span>
                            <span className="text-neutral-400 ml-1 md:ml-2">interviews included</span>
                        </p>
                    ) : (
                        <p className="font-nav-font text-neutral-400 text-sm md:text-base">
                            Custom interview package
                        </p>
                    )}
                </div>

                <div className="flex-1 space-y-2 md:space-y-3 mb-6 md:mb-8">
                    {perks.map((perk, index) => (
                        <div key={index} className="flex items-center gap-2 md:gap-3">
                            <svg
                                className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0"
                                fill="none"
                                stroke={accent}
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                            <span className="font-nav-font text-neutral-400 text-xs md:text-sm">{perk}</span>
                        </div>
                    ))}
                </div>

                {interviews !== null && (
                    <p className="font-nav-font text-neutral-500 text-[10px] md:text-xs text-center mb-2 md:mb-3">
                        Monthly subscription
                    </p>
                )}

                <button
                    className="w-full font-btn-font text-xs md:text-sm px-4 md:px-6 py-3 md:py-4 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center gap-2"
                    style={{
                        backgroundColor: popular ? accent : 'transparent',
                        color: popular ? '#000' : accent,
                        border: popular ? 'none' : `1px solid ${accent}40`
                    }}
                    onMouseEnter={(e) => {
                        if (!popular) {
                            e.currentTarget.style.backgroundColor = `${accent}15`;
                            e.currentTarget.style.borderColor = accent;
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!popular) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = `${accent}40`;
                        }
                    }}
                    onClick={() => priceId && onSubscribe?.(priceId)}
                >
                    {interviews !== null ? 'Subscribe' : 'Contact Us'}
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
}

function GoToInterviewButton() {
    const navigate = useNavigate();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 md:mt-8"
        >
            <button
                onClick={() => navigate("/interview")}
                className="group relative font-btn-font px-8 py-4 md:px-12 md:py-5 text-sm md:text-lg cursor-pointer overflow-hidden rounded-full border border-white/20 bg-transparent text-white transition-all duration-300 hover:border-white/40 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
                <span className="relative z-10 flex items-center gap-2 md:gap-3">
                    Go to Interview
                    <svg className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </span>
                <div className="absolute inset-0 bg-linear-to-r from-white/0 via-white/5 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </button>
        </motion.div>
    );
}

