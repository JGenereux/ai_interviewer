import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/authContext";
import axios from "axios";
import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL

type Interview = {
    id: string;
    date: string;
    overallScore: number | null;
    technicalScore: number | null;
    behavioralScore: number | null;
    mode: string;
    problemCount: number;
};

type BillingHistoryItem = {
    id: string;
    stripeId: string;
    userId: string;
    amount: number;
    description: string;
    createdAt: string;
    type: 'subscription' | 'payment' | 'purchase';
};

export default function Profile() {
    const { id } = useAuth();
    const navigate = useNavigate();

    if (!id) {
        navigate('/login');
        return null;
    }

    return (
        <div className="main-bg min-h-screen">
            <Navbar />
            <div className="px-6 py-12 max-w-5xl mx-auto">
                <ProfileContent />
            </div>
        </div>
    );
}

function ProfileContent() {
    const { id, userName, fullName, xp, interviewIds, createdAt, logout, tokens, subscription } = useAuth();
    const navigate = useNavigate();
    const [interviews, setInterviews] = useState<Interview[]>([]);
    const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [billingLoading, setBillingLoading] = useState(true);

    useEffect(() => {
        const fetchInterviews = async () => {
            if (!id) return;

            try {
                const response = await axios.get(`${API_URL}/users/${id}/interviews`);
                setInterviews(response.data.interviews);
            } catch (error) {
                console.error('Failed to fetch interviews:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchBillingHistory = async () => {
            if (!id) return;

            try {
                const token = (await import('@/utils/supabaseDB')).default;
                const { data } = await token.auth.getSession();
                const accessToken = data.session?.access_token;

                const response = await axios.get(`${API_URL}/payment/billing-history/${id}`, {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });
                setBillingHistory(response.data);
            } catch (error) {
                console.error('Failed to fetch billing history:', error);
            } finally {
                setBillingLoading(false);
            }
        };

        fetchInterviews();
        fetchBillingHistory();
    }, [id]);

    const level = Math.floor(xp / 500) + 1;
    const xpForCurrentLevel = (level - 1) * 500;
    const xpForNextLevel = level * 500;
    const progressToNext = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

    const memberSince = createdAt ? new Date(createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric'
    }) : 'Unknown';

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 14) return '1 week ago';
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const interviewsWithScores = interviews.filter(i => i.overallScore !== null);
    const avgTechnical = interviewsWithScores.filter(i => i.technicalScore !== null).length > 0
        ? interviewsWithScores.filter(i => i.technicalScore !== null).reduce((acc, i) => acc + (i.technicalScore || 0), 0) / interviewsWithScores.filter(i => i.technicalScore !== null).length
        : 0;
    const avgBehavioral = interviewsWithScores.filter(i => i.behavioralScore !== null).length > 0
        ? interviewsWithScores.filter(i => i.behavioralScore !== null).reduce((acc, i) => acc + (i.behavioralScore || 0), 0) / interviewsWithScores.filter(i => i.behavioralScore !== null).length
        : 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
        >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-blue-500 to-green-500 flex items-center justify-center">
                        <span className="font-header-font text-3xl text-white">
                            {userName?.[0]?.toUpperCase() || '?'}
                        </span>
                    </div>
                    <div>
                        <h1 className="font-header-font text-3xl text-white">@{userName}</h1>
                        <p className="font-nav-font text-neutral-400 text-sm">{fullName}</p>
                        <p className="font-nav-font text-neutral-600 text-xs mt-1">Member since {memberSince}</p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="group font-btn-font text-sm px-6 py-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-300 cursor-pointer flex items-center gap-2 w-fit"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="md:col-span-2 p-6 rounded-2xl bg-[#161616] border border-white/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-nav-font text-neutral-500 text-xs uppercase tracking-wider">Experience Points</p>
                            <p className="font-header-font text-4xl text-white">{xp.toLocaleString()} <span className="text-lg text-neutral-500">XP</span></p>
                        </div>
                        <div className="text-right">
                            <p className="font-nav-font text-neutral-500 text-xs uppercase tracking-wider">Level</p>
                            <p className="font-header-font text-4xl text-blue-400">{level}</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-nav-font text-neutral-500">
                            <span>{xp - xpForCurrentLevel} / {xpForNextLevel - xpForCurrentLevel} to next level</span>
                            <span>{Math.round(progressToNext)}%</span>
                        </div>
                        <div className="h-3 rounded-full bg-[#1a1a1a] overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progressToNext}%` }}
                                transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                                className="h-full rounded-full bg-linear-to-r from-blue-500 to-green-500"
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-[#161616] border border-white/10"
                >
                    <p className="font-nav-font text-neutral-500 text-xs uppercase tracking-wider mb-2">Interviews Completed</p>
                    <p className="font-header-font text-4xl text-white">{interviewIds?.length || 0}</p>
                    <p className="font-nav-font text-neutral-600 text-xs mt-2">Keep practicing to improve!</p>
                </motion.div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="p-6 rounded-2xl bg-[#161616] border border-white/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-nav-font text-neutral-500 text-xs uppercase tracking-wider">Token Balance</p>
                            <p className="font-header-font text-4xl text-white">{tokens.toLocaleString()}</p>
                        </div>
                        <div className="p-3 rounded-xl bg-green-500/15">
                            <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="font-nav-font text-neutral-400 text-sm">
                            ~{Math.floor(tokens / 750)} interviews remaining
                        </p>
                        <button
                            onClick={() => navigate('/pricing')}
                            className="font-btn-font text-xs px-4 py-2 bg-green-500/20 text-green-400 rounded-lg cursor-pointer hover:bg-green-500/30 transition-colors"
                        >
                            Get More
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-2xl bg-[#161616] border border-white/10"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-nav-font text-neutral-500 text-xs uppercase tracking-wider">Current Plan</p>
                            <p className="font-header-font text-4xl text-white capitalize">
                                {subscription?.subscription || 'Free'}
                            </p>
                        </div>
                        <div className={`p-3 rounded-xl ${subscription?.subscription === 'pro' ? 'bg-green-500/15' :
                            subscription?.subscription === 'starter' ? 'bg-blue-500/15' :
                                'bg-neutral-500/15'
                            }`}>
                            <svg className={`w-6 h-6 ${subscription?.subscription === 'pro' ? 'text-green-400' :
                                subscription?.subscription === 'starter' ? 'text-blue-400' :
                                    'text-neutral-400'
                                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="font-nav-font text-neutral-400 text-sm">
                            {subscription?.subscription === 'pro' ? 'Min 15 interviews/month' :
                                subscription?.subscription === 'starter' ? 'Min 6 interviews/month' :
                                    '1 free interview included'}
                        </p>
                        {!subscription?.subscription && (
                            <button
                                onClick={() => navigate('/pricing')}
                                className="font-btn-font text-xs px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg cursor-pointer hover:bg-blue-500/30 transition-colors"
                            >
                                Upgrade
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <StatCard
                    label="Total Interviews"
                    value={interviews.length.toString()}
                    accent="#3B82F6"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    }
                    delay={0.3}
                />
                <StatCard
                    label="Avg Technical"
                    value={avgTechnical > 0 ? avgTechnical.toFixed(1) : '-'}
                    accent="#10B981"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                    }
                    delay={0.4}
                />
                <StatCard
                    label="Avg Behavioral"
                    value={avgBehavioral > 0 ? avgBehavioral.toFixed(1) : '-'}
                    accent="#F59E0B"
                    icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    }
                    delay={0.5}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="p-6 rounded-2xl bg-[#161616] border border-white/10"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-header-font text-xl text-white">Recent Interviews</h2>
                    <span className="font-nav-font text-neutral-500 text-xs">
                        {loading ? 'Loading...' : `${interviews.length} sessions`}
                    </span>
                </div>
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-neutral-500 font-nav-font">
                            Loading interviews...
                        </div>
                    ) : interviews.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 font-nav-font">
                            No interviews yet. Start your first one!
                        </div>
                    ) : (
                        interviews.slice(0, 10).map((interview, index) => (
                            <motion.div
                                key={interview.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + index * 0.1 }}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                        <span className="font-btn-font text-white/60 text-xs">
                                            {interview.mode === 'behavioral' ? 'B' : interview.mode === 'technical' ? 'T' : 'F'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-btn-font text-white text-sm">
                                            {interview.mode === 'behavioral' ? 'Behavioral' :
                                                interview.mode === 'technical' ? 'Technical' : 'Full'} Interview
                                        </p>
                                        <p className="font-nav-font text-neutral-500 text-xs">{formatDate(interview.date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    {interview.technicalScore !== null && (
                                        <div className="text-center">
                                            <p className="font-nav-font text-neutral-500 text-xs">Technical</p>
                                            <p className="font-btn-font text-green-400 text-sm">{interview.technicalScore}/10</p>
                                        </div>
                                    )}
                                    {interview.behavioralScore !== null && (
                                        <div className="text-center">
                                            <p className="font-nav-font text-neutral-500 text-xs">Behavioral</p>
                                            <p className="font-btn-font text-amber-400 text-sm">{interview.behavioralScore}/10</p>
                                        </div>
                                    )}
                                    {interview.overallScore !== null ? (
                                        <div className={`px-3 py-1.5 rounded-lg ${interview.overallScore >= 8 ? 'bg-green-500/20 text-green-400' :
                                            interview.overallScore >= 6 ? 'bg-amber-500/20 text-amber-400' :
                                                'bg-red-500/20 text-red-400'
                                            }`}>
                                            <span className="font-btn-font text-sm">{interview.overallScore}</span>
                                        </div>
                                    ) : (
                                        <div className="px-3 py-1.5 rounded-lg bg-neutral-500/20 text-neutral-400">
                                            <span className="font-btn-font text-sm">-</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="p-6 rounded-2xl bg-[#161616] border border-white/10"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-header-font text-xl text-white">Billing History</h2>
                    <span className="font-nav-font text-neutral-500 text-xs">
                        {billingLoading ? 'Loading...' : `${billingHistory.length} transactions`}
                    </span>
                </div>
                <div className="space-y-3">
                    {billingLoading ? (
                        <div className="text-center py-8 text-neutral-500 font-nav-font">
                            Loading billing history...
                        </div>
                    ) : billingHistory.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 font-nav-font">
                            No billing history yet.
                        </div>
                    ) : (
                        billingHistory.map((item, index) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.9 + index * 0.05 }}
                                className="flex items-center justify-between p-4 rounded-xl bg-[#1a1a1a] border border-white/5 hover:border-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.type === 'subscription' ? 'bg-blue-500/15' : 'bg-green-500/15'
                                        }`}>
                                        {item.type === 'subscription' ? (
                                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-btn-font text-white text-sm">{item.description}</p>
                                        <p className="font-nav-font text-neutral-500 text-xs">
                                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-btn-font text-sm ${item.amount > 0 ? 'text-green-400' : 'text-neutral-400'
                                        }`}>
                                        ${(item.amount / 100).toFixed(2)}
                                    </p>
                                    <p className="font-nav-font text-neutral-600 text-xs capitalize">{item.type}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="text-center"
            >
                <button
                    onClick={() => navigate('/interview')}
                    className="group font-btn-font text-base px-8 py-4 rounded-xl bg-white text-black cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] inline-flex items-center gap-3"
                >
                    Start New Interview
                    <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>
            </motion.div>
        </motion.div>
    );
}

function StatCard({ label, value, accent, icon, delay }: {
    label: string;
    value: string;
    accent: string;
    icon: React.ReactNode;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="group relative p-6 rounded-2xl bg-[#161616] border border-white/10 hover:border-white/20 transition-all duration-300"
        >
            <div
                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500 -z-10"
                style={{ background: `linear-gradient(135deg, ${accent}30, transparent)` }}
            />
            <div className="flex items-center gap-4 mb-4">
                <div
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${accent}15`, color: accent }}
                >
                    {icon}
                </div>
            </div>
            <p className="font-nav-font text-neutral-500 text-xs uppercase tracking-wider mb-1">{label}</p>
            <p className="font-header-font text-3xl text-white">{value}</p>
        </motion.div>
    );
}
