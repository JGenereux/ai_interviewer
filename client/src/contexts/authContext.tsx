/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import dbClient from "@/utils/supabaseDB";
import type { InterviewFeedback } from "@/types/interview";

interface Subscription {
    id: string | null;
    subscription: 'free' | 'starter' | 'pro';
}

interface AuthState {
    id: string | null;
    createdAt: Date | null;
    fullName: string | null;
    xp: number;
    resume: InterviewFeedback | null;
    userName: string;
    interviewIds: string[];
    tokens: number;
    subscription: Subscription | null;
    signupComplete: boolean;
}

interface AuthContextType {
    id: string | null;
    createdAt: Date | null;
    fullName: string | null;
    xp: number;
    resume: InterviewFeedback | null;
    userName: string;
    interviewIds: string[];
    tokens: number;
    subscription: Subscription | null;
    signupComplete: boolean;
    signup: (email: string, password: string, fullName: string, resume: any, userName: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>) => Promise<boolean>,
    login: (email: string, password: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>, redirectTo?: string) => Promise<void>,
    logout: () => void,
    addUser: (sessionID: string) => void,
    updateXp: (feedback: InterviewFeedback) => Promise<number>,
    setTokens: (tokens: number) => void
}

export const AuthContext = createContext<AuthContextType>({
    id: null,
    createdAt: null,
    fullName: '',
    xp: 0,
    resume: null,
    userName: '',
    interviewIds: [],
    tokens: 0,
    subscription: null,
    signupComplete: true,
    signup: async () => {
        throw new Error("signup function not implemented")
    },
    login: async () => {
        throw new Error("login function not implemented")
    },
    logout: () => {
        throw new Error("logout function not implemented")
    },
    addUser: () => {
        throw new Error("addUser function not implemented")
    },
    updateXp: async () => {
        throw new Error("updateXp function not implemented")
    },
    setTokens: () => {
        throw new Error("setTokens function not implemented")
    }
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const navigate = useNavigate()
    const [auth, setAuth] = useState<AuthState>({
        id: "",
        createdAt: null,
        fullName: '',
        xp: 0,
        resume: null,
        userName: '',
        interviewIds: [],
        tokens: 0,
        subscription: null,
        signupComplete: true
    })

    useEffect(() => {
        const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (_, session) => {
            if (session) {
                try {
                    const response = await axios.get(`http://localhost:3000/users/${session.user.id}`, {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`
                        }
                    });

                    const { user } = response.data
                    setAuth({
                        id: session.user.id,
                        createdAt: user.createdAt,
                        fullName: user.fullName,
                        xp: user.xp,
                        resume: user.resume,
                        userName: user.userName,
                        interviewIds: user.interviewIds,
                        tokens: user.tokens ?? 0,
                        subscription: user.subscription ?? null,
                        signupComplete: user.signup_complete ?? true
                    });
                } catch (error) {
                    if (axios.isAxiosError(error) && error.response?.status === 404) {
                        const supabaseUser = session.user;
                        const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '';

                        try {
                            const oauthResponse = await axios.post('http://localhost:3000/users/oauth', {
                                userId: session.user.id,
                                email: supabaseUser.email,
                                fullName
                            });

                            const { user } = oauthResponse.data;
                            setAuth({
                                id: session.user.id,
                                createdAt: user.createdAt,
                                fullName: user.fullName,
                                xp: user.xp ?? 0,
                                resume: user.resume,
                                userName: user.userName,
                                interviewIds: user.interview_ids ?? [],
                                tokens: user.tokens ?? 0,
                                subscription: user.subscription ?? null,
                                signupComplete: user.signup_complete ?? false
                            });
                        } catch (oauthError) {
                            console.error('Failed to create OAuth user:', oauthError);
                            await dbClient.auth.signOut();
                        }
                    } else {
                        await dbClient.auth.signOut();
                    }
                }
            } else {
                setAuth({
                    id: "",
                    createdAt: null,
                    fullName: '',
                    xp: 0,
                    resume: null,
                    userName: '',
                    interviewIds: [],
                    tokens: 0,
                    subscription: null,
                    signupComplete: true
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (auth.id && !auth.signupComplete) {
            const currentPath = window.location.pathname;
            if (currentPath !== '/signup') {
                navigate('/signup?oauth=true');
            }
        }
    }, [auth.id, auth.signupComplete, navigate]);

    const signup = async (email: string, password: string, fullName: string, resume: any, userName: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>): Promise<boolean> => {
        try {
            const sessionID = crypto.randomUUID()
            const { error: signupErr } = await dbClient.auth.signUp({
                email: email, password: password, options: {
                    emailRedirectTo: `http://localhost:5173/login?sessionID=${sessionID}`
                }
            })

            if (signupErr) {
                setAuthError(signupErr.message || "Failed to sign up");
                return false;
            }

            await axios.post('http://localhost:3000/users', {
                sessionID,
                fullName: fullName,
                resume: resume,
                userName: userName
            })
            return true;
        } catch (error) {
            if (error instanceof AxiosError) {
                setAuthError(error.response?.data.message || "Failed to sign up");
            }
            return false;
        }
    }

    const addUser = async (sessionID: string) => {
        const { data } = await dbClient.auth.getUser()
        if (!data.user) return

        try {
            const res = await axios.post('http://localhost:3000/users/confirm', {
                sessionID,
                userId: data.user.id
            })

            const { user } = res.data
            setAuth({
                id: user.id,
                createdAt: user.createdAt,
                fullName: user.fullName,
                xp: user.xp,
                resume: user.resume,
                userName: user.userName,
                interviewIds: user.interviewIds,
                tokens: user.tokens ?? 0,
                subscription: user.subscription ?? null,
                signupComplete: user.signup_complete ?? true
            })

            return
        } catch (error) {
            console.error(error)
        }
    }

    const login = async (email: string, password: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>, redirectTo?: string) => {
        const { error } = await dbClient.auth.signInWithPassword({ email, password });
        if (error) {
            setAuthError(error.message || "Failed to login");
            return;
        }

        navigate(redirectTo || '/')
    }

    const logout = async () => {
        await dbClient.auth.signOut();
        setAuth({
            id: "",
            createdAt: null,
            fullName: '',
            xp: 0,
            resume: null,
            userName: '',
            interviewIds: [],
            tokens: 0,
            subscription: null,
            signupComplete: true
        });
        navigate('/');
    }

    const updateXp = async (feedback: InterviewFeedback): Promise<number> => {
        if (!auth.id) return 0;

        try {
            const response = await axios.post('http://localhost:3000/users/xp', {
                userId: auth.id,
                technicalScore: feedback.technical?.score ?? null,
                behavioralScore: feedback.behavioral?.score ?? null,
                overallScore: feedback.overallScore
            });

            const { newXp, xpGained } = response.data;
            setAuth(prev => ({ ...prev, xp: newXp }));
            return xpGained;
        } catch (error) {
            console.error('Failed to update XP:', error);
            return 0;
        }
    }

    const setTokens = (tokens: number) => {
        setAuth(prev => ({ ...prev, tokens }));
    }

    return <AuthContext.Provider value={{ ...auth, signup, login, logout, addUser, updateXp, setTokens }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}