import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dbClient from '@/utils/supabaseDB';
import Navbar from '@/components/navbar';
import { motion } from 'motion/react';
import { useAuth } from '@/contexts/authContext';

export default function OAuth() {
    const navigate = useNavigate();
    const { id, signupComplete } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [sessionSet, setSessionSet] = useState(false);

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                console.log('wtf')
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                const accessToken = hashParams.get('access_token');
                const refreshToken = hashParams.get('refresh_token');

                if (!accessToken || !refreshToken) {
                    setError('Authentication failed. Missing tokens.');
                    return;
                }

                console.log('?')
                const { error: sessionError } = await dbClient.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                });

                if (sessionError) {
                    setError('Failed to establish session.');
                    return;
                }

                setSessionSet(true);
            } catch (err) {
                console.error('OAuth callback error:', err);
                setError('An error occurred during authentication.');
            }
        };

        handleOAuthCallback();
    }, []);

    useEffect(() => {
        if (sessionSet && id) {
            if (signupComplete) {
                navigate('/');
            } else {
                navigate('/signup?oauth=true');
            }
        }
    }, [sessionSet, id, signupComplete, navigate]);

    return (
        <div className="flex flex-col min-h-screen main-bg">
            <Navbar />
            <div className="flex-1 flex items-center justify-center">
                {error ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="font-nav-font text-red-400 text-lg mb-4">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="font-btn-font text-sm px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                        >
                            Back to Login
                        </button>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <p className="font-nav-font text-white/70 text-lg">Completing authentication...</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
