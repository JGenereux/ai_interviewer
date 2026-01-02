import Navbar from "@/components/navbar";
import { useAuth } from "@/contexts/authContext";
import axios from "axios";
import { motion } from "motion/react";
import { useState, useEffect } from "react";

type LeaderboardUser = {
    rank: number;
    username: string;
    xp: number;
    interviews: number;
    id: string;
};

export default function Leaderboard() {
    return (
        <div className="main-bg min-h-screen">
            <Navbar />
            <div className="px-6 py-8 max-w-5xl mx-auto">
                <TerminalWindow />
            </div>
        </div>
    );
}

function TerminalWindow() {
    const { id: userId } = useAuth();
    const [bootSequence, setBootSequence] = useState(0);
    const [showTable, setShowTable] = useState(false);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);
    const [totalUsers, setTotalUsers] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const url = userId
                    ? `http://localhost:3000/users/leaderboard?userId=${userId}`
                    : 'http://localhost:3000/users/leaderboard';
                const response = await axios.get(url);
                setLeaderboard(response.data.leaderboard);
                setCurrentUser(response.data.currentUser);
                setTotalUsers(response.data.totalUsers);
            } catch (error) {
                console.error('Failed to fetch leaderboard:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, [userId]);

    useEffect(() => {
        if (loading) return;

        const timers = [
            setTimeout(() => setBootSequence(1), 300),
            setTimeout(() => setBootSequence(2), 800),
            setTimeout(() => setBootSequence(3), 1300),
            setTimeout(() => setShowTable(true), 1800),
        ];
        return () => timers.forEach(clearTimeout);
    }, [loading]);

    const maxInterviews = Math.max(...leaderboard.map(u => u.interviews), currentUser?.interviews || 0, 1);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-lg overflow-hidden border border-[#33ff33]/20 shadow-[0_0_15px_rgba(51,255,51,0.05)]"
        >
            <div className="bg-[#1a1a1a] border-b border-[#33ff33]/20 px-3 md:px-4 py-2 flex items-center gap-2">
                <div className="flex gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ff5f56]" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ffbd2e]" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27ca40]" />
                </div>
                <span className="font-nav-font text-[#33ff33]/60 text-[10px] md:text-xs ml-2 md:ml-4 truncate">FIRSTOFFER_LEADERBOARD.exe</span>
                <div className="ml-auto flex gap-2 md:gap-4 text-[#33ff33]/40 text-xs font-nav-font">
                    <span>_</span>
                    <span>□</span>
                    <span>×</span>
                </div>
            </div>

            <div className="bg-[#0a0a0a] p-3 md:p-6 font-nav-font text-[#33ff33] min-h-[400px] md:min-h-[600px] relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none opacity-5" style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(51, 255, 51, 0.03) 2px, rgba(51, 255, 51, 0.03) 4px)'
                }} />

                <div className="relative z-10">
                    <AsciiHeader />

                    <div className="mt-4 md:mt-6 space-y-1 text-xs md:text-sm">
                        <BootLine show={bootSequence >= 1} delay={0}>
                            {"> Initializing leaderboard..."}
                        </BootLine>
                        <BootLine show={bootSequence >= 2} delay={0.1}>
                            {"> Fetching user rankings..."}
                        </BootLine>
                        <BootLine show={bootSequence >= 3} delay={0.2}>
                            {`> ${totalUsers} users found`}
                        </BootLine>
                    </div>

                    {showTable && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            className="mt-8"
                        >
                            <LeaderboardTable users={leaderboard} maxInterviews={maxInterviews} currentUserId={userId} />
                            {currentUser && <UserStatus user={currentUser} maxInterviews={maxInterviews} />}
                            <ControlsFooter />
                        </motion.div>
                    )}
                </div>

                <div className="absolute bottom-4 right-4 w-2 h-4 bg-[#33ff33] animate-pulse" />
            </div>
        </motion.div>
    );
}

function AsciiHeader() {
    const ascii = `
██╗     ███████╗ █████╗ ██████╗ ███████╗██████╗ ███████╗
██║     ██╔════╝██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔════╝
██║     █████╗  ███████║██║  ██║█████╗  ██████╔╝███████╗
██║     ██╔══╝  ██╔══██║██║  ██║██╔══╝  ██╔══██╗╚════██║
███████╗███████╗██║  ██║██████╔╝███████╗██║  ██║███████║
╚══════╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝`;

    return (
        <motion.pre
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-[#33ff33] text-[10px] md:text-xs leading-none whitespace-pre overflow-x-auto scrollbar-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
            {ascii}
        </motion.pre>
    );
}

function BootLine({ children, show, delay }: { children: React.ReactNode; show: boolean; delay: number }) {
    if (!show) return null;

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            {children}
        </motion.div>
    );
}

function LeaderboardTable({ users, maxInterviews, currentUserId }: { users: LeaderboardUser[]; maxInterviews: number; currentUserId: string | null }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
                <thead>
                    <tr className="border-b border-[#33ff33]/30 text-[#33ff33]/70">
                        <th className="text-left py-2 px-1 md:px-2 w-10 md:w-16">RNK</th>
                        <th className="text-left py-2 px-1 md:px-2">USER</th>
                        <th className="text-right py-2 px-1 md:px-2 w-16 md:w-24">XP</th>
                        <th className="text-left py-2 px-1 md:px-2 w-20 md:w-48 hidden sm:table-cell">INTERVIEWS</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user, index) => {
                        const isCurrentUser = user.id === currentUserId;
                        return (
                            <motion.tr
                                key={user.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`border-b transition-colors ${isCurrentUser
                                        ? "border-[#00ffff]/30 bg-[#00ffff]/10 text-[#00ffff]"
                                        : `border-[#33ff33]/10 hover:bg-[#33ff33]/5 ${user.rank <= 3 ? "text-[#33ff33]" : "text-[#33ff33]/80"}`
                                    }`}
                            >
                                <td className="py-2 px-1 md:px-2">
                                    <span className={`${isCurrentUser ? "text-[#00ffff]" :
                                            user.rank === 1 ? "text-[#ffd700]" :
                                                user.rank === 2 ? "text-[#c0c0c0]" :
                                                    user.rank === 3 ? "text-[#cd7f32]" : ""
                                        }`}>
                                        {String(user.rank).padStart(3, "0")}
                                    </span>
                                </td>
                                <td className="py-2 px-1 md:px-2">
                                    <span className={isCurrentUser ? "text-[#00ffff]/50" : "text-[#33ff33]/50"}>@</span>
                                    <span className="truncate max-w-[80px] md:max-w-none inline-block align-bottom">{user.username}</span>
                                    {isCurrentUser && <span className="ml-1 md:ml-2 text-[10px] md:text-xs text-[#00ffff]/60">(you)</span>}
                                </td>
                                <td className="py-2 px-1 md:px-2 text-right font-btn-font">
                                    {user.xp.toLocaleString()}
                                </td>
                                <td className="py-2 px-1 md:px-2 hidden sm:table-cell">
                                    <div className="flex items-center gap-2">
                                        <ProgressBar value={user.interviews} max={maxInterviews} isCurrentUser={isCurrentUser} />
                                        <span className={`w-6 text-right ${isCurrentUser ? "text-[#00ffff]/60" : "text-[#33ff33]/60"}`}>
                                            {user.interviews}
                                        </span>
                                    </div>
                                </td>
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

function ProgressBar({ value, max, isCurrentUser = false }: { value: number; max: number; isCurrentUser?: boolean }) {
    const filled = Math.round((value / max) * 14);
    const empty = 14 - filled;
    const color = isCurrentUser ? "text-[#00ffff]" : "text-[#33ff33]";
    const fadedColor = isCurrentUser ? "text-[#00ffff]/20" : "text-[#33ff33]/20";

    return (
        <span className="font-nav-font tracking-tighter">
            <span className={color}>{"█".repeat(filled)}</span>
            <span className={fadedColor}>{"░".repeat(empty)}</span>
        </span>
    );
}

function UserStatus({ user, maxInterviews }: { user: LeaderboardUser; maxInterviews: number }) {
    const isInTop15 = user.rank <= 15;

    if (isInTop15) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.8 }}
            className="mt-4 md:mt-6"
        >
            <div className="border border-[#00ffff]/30 bg-[#00ffff]/5 rounded-lg p-3 md:p-4">
                <div className="text-[10px] md:text-xs text-[#00ffff]/50 mb-2 md:mb-3 font-nav-font">{"> YOUR RANKING"}</div>
                <table className="w-full text-xs md:text-sm">
                    <tbody>
                        <tr className="text-[#00ffff]">
                            <td className="py-1 px-1 md:px-2 w-10 md:w-16">
                                <span className="text-[#00ffff]">
                                    {String(user.rank).padStart(3, "0")}
                                </span>
                            </td>
                            <td className="py-1 px-1 md:px-2">
                                <span className="text-[#00ffff]/50">@</span>
                                <span className="truncate max-w-[80px] md:max-w-none inline-block align-bottom">{user.username}</span>
                                <span className="ml-1 md:ml-2 text-[10px] md:text-xs text-[#00ffff]/60">(you)</span>
                            </td>
                            <td className="py-1 px-1 md:px-2 text-right font-btn-font w-16 md:w-24">
                                {user.xp.toLocaleString()}
                            </td>
                            <td className="py-1 px-1 md:px-2 w-20 md:w-48 hidden sm:table-cell">
                                <div className="flex items-center gap-2">
                                    <ProgressBar value={user.interviews} max={maxInterviews} isCurrentUser />
                                    <span className="text-[#00ffff]/60 w-6 text-right">{user.interviews}</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}

function ControlsFooter() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 1 }}
            className="mt-4 md:mt-6 text-[10px] md:text-xs text-[#33ff33]/40 flex flex-wrap gap-3 md:gap-6"
        >
            <span>[↑] Scroll up</span>
            <span>[↓] Scroll down</span>
            <span>[Q] Quit</span>
        </motion.div>
    );
}
