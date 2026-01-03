import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        const success = await login(email, password);
        if (success) {
            navigate('/');
        } else {
            setError('Invalid credentials or unauthorized access.');
        }
        setSubmitting(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full glass p-8 rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full -ml-16 -mb-16 blur-3xl"></div>

                <div className="relative">
                    <div className="flex justify-center mb-6">
                        <div className="p-3 bg-primary/10 rounded-xl">
                            <LogIn className="w-8 h-8 text-primary" />
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-center mb-2">Tiye Admin</h1>
                    <p className="text-gray-400 text-center mb-8">Secure platform operations</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm mb-6 text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@tiye.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-surface border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center group"
                        >
                            {submitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span className="mr-2">Sign In</span>
                                    <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
