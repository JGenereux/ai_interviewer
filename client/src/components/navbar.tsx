import { Link, useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { SignalIcon } from "./icons/signalIcon";
import { useAuth } from "@/contexts/authContext";
import { useState } from "react";

export default function Navbar() {
    const { id, userName } = useAuth()
    const navigate = useNavigate()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    
    const links = [
        { path: '/', name: 'Home', tourId: null },
        { path: '/interview', name: 'Interview', tourId: 'interview-link' },
        { path: '/leaderboard', name: 'Leaderboard', tourId: 'leaderboard-link' },
        { path: '/pricing', name: 'Pricing', tourId: null }
    ]

    return (
        <>
            <Card className="relative shadow-[#302e2e] shadow-sm bg-transparent flex flex-row w-full border-0 rounded-none py-3 px-4 md:px-6 items-center">
                <button 
                    onClick={() => setMobileMenuOpen(true)}
                    className="md:hidden p-2 text-white hover:text-white/80 transition-colors"
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                <div className="hidden md:flex flex-row gap-6">
                    {links?.map((l, i) => (
                        <Link 
                            className="text-white font-nav-font text-sm hover:text-white/80 transition-colors" 
                            key={i} 
                            to={l.path}
                            {...(l.tourId ? { 'data-tour': l.tourId } : {})}
                        >
                            {l.name}
                        </Link>
                    ))}
                </div>

                <div 
                    onClick={() => navigate(id ? '/profile' : '/login')} 
                    className="flex flex-row items-center ml-auto w-fit gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                    data-tour="profile-link"
                >
                    <p className="text-neutral-400 tracking-wide font-nav-font text-xs">{id ? userName : 'Sign In'}</p>
                    <SignalIcon className={`w-6 h-6 transition ${id ? 'text-(--cyber-cyan) hover:text-(--cyber-cyan)/80' : 'text-neutral-300 hover:text-white'}`} />
                </div>
            </Card>

            {mobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                >
                    <div 
                        className="absolute left-0 top-0 h-full w-64 bg-[#161616] border-r border-white/10 p-6 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <span className="font-header-font text-xl text-white">MENU</span>
                            <button 
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 text-white/60 hover:text-white transition-colors"
                                aria-label="Close menu"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <nav className="flex flex-col gap-4">
                            {links?.map((l, i) => (
                                <Link 
                                    className="text-white font-nav-font text-base py-2 hover:text-white/80 transition-colors border-b border-white/5" 
                                    key={i} 
                                    to={l.path}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {l.name}
                                </Link>
                            ))}
                        </nav>

                        <div className="absolute bottom-6 left-6 right-6">
                            <div 
                                onClick={() => {
                                    navigate(id ? '/profile' : '/login')
                                    setMobileMenuOpen(false)
                                }} 
                                className="flex flex-row items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity py-3 px-4 bg-white/5 rounded-lg"
                            >
                                <SignalIcon className={`w-5 h-5 ${id ? 'text-(--cyber-cyan)' : 'text-neutral-300'}`} />
                                <p className="text-neutral-300 font-nav-font text-sm">{id ? userName : 'Sign In'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
