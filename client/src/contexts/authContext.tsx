/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useContext, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import dbClient from "@/utils/supabaseDB";
import type { InterviewFeedback } from "@/types/interview";

const API_URL = import.meta.env.VITE_API_URL;

interface AuthState {
    id: string | null;
    createdAt: Date | null;
    fullName: string | null;
    xp: number;
    resume: InterviewFeedback | null;
    userName: string;
    attemptedProblems: string[];
}

interface AuthContextType {
    id: string | null;
    createdAt: Date | null;
    fullName: string | null;
    xp: number;
    resume: InterviewFeedback | null;
    userName: string;
    attemptedProblems: string[];
    signup: (email: string, password: string, fullName: string, resume: any, userName: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>) => Promise<void>,
    login: (email: string, password: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>) => Promise<void>,
    logout: () => void,
    addUser: (sessionID: string) => void
}

export const AuthContext = createContext<AuthContextType>({
    id: null,
    createdAt: null,
    fullName: '',
    xp: 0,
    resume: null,
    userName: '',
    attemptedProblems: [],
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
        attemptedProblems: []
    })

    useEffect(() => {
        const { data: { subscription } } = dbClient.auth.onAuthStateChange(async (_, session) => {
            if (session) {
                try {
                    const { data: userData, error } = await dbClient.auth.getUser(session.access_token)
                    if (error || !userData?.user) {
                        console.log(error)
                        return
                    }

                    console.log(session.user.id)
                    const response = await axios.get(`http://localhost:3000/users/${session.user.id}`, {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`
                        }
                    })

                    const { user } = response.data
                    console.log(user)
                    setAuth({
                        id: session.user.id,
                        createdAt: user.createdAt,
                        fullName: user.fullName,
                        xp: user.xp,
                        resume: user.resume,
                        userName: user.userName,
                        attemptedProblems: user.attemptedProblems
                    });
                } catch (error) {
                    console.error(error)
                    await dbClient.auth.signOut();
                }
            } else {
                console.log('no session?')
                setAuth({
                    id: "",
                    createdAt: null,
                    fullName: '',
                    xp: 0,
                    resume: null,
                    userName: '',
                    attemptedProblems: []
                });
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signup = async (email: string, password: string, fullName: string, resume: any, userName: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>) => {
        try {
            const sessionID = crypto.randomUUID()
            dbClient.auth.signUp({
                email: email, password: password, options: {
                    emailRedirectTo: `http://localhost:5173/signup?sessionID=${sessionID}`
                }
            })

            await axios.post('http://localhost:3000/users', {
                sessionID,
                fullName: fullName,
                resume: resume,
                userName: userName
            })

            window.alert("Please confirm signup in email")
        } catch (error) {
            if (error instanceof AxiosError) {
                setAuthError(error.response?.data.message || "Failed to sign up");
            }
            return;
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
                attemptedProblems: user.attemptedProblems
            })

            return
        } catch (error) {
            console.error(error)
        }
    }

    const login = async (email: string, password: string, setAuthError: React.Dispatch<React.SetStateAction<string | null>>) => {
        const { error } = await dbClient.auth.signInWithPassword({ email, password });
        if (error) {
            setAuthError(error.message || "Failed to login");
            return;
        }

        navigate('/')
    }

    const logout = async () => {
    }

    return <AuthContext.Provider value={{ ...auth, signup, login, logout, addUser }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}