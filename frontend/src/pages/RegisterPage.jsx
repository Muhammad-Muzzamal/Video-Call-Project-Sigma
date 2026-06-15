import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, User, UserCheck, Video } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../config/api.config.js';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading]   = useState(false);
    const [form, setForm]         = useState({ name: '', username: '', password: '' });

    const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/auth/register', form);
            toast.success('Account created! Redirecting to login...');
            setTimeout(() => navigate('/login'), 1200);
        } catch (err) {
            if (err.response?.status === 409 || err.response?.status === 400) {
                toast.error(err.response.data?.message || 'Username already taken.');
            } else if (err.response) {
                toast.error(err.response.data?.message || 'Server error. Try again.');
            } else {
                toast.error('Network error. Check your connection.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#08080f] text-zinc-100 flex flex-col relative overflow-hidden font-sans">

            {/* Ambient glow */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-violet-900/10 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-900/8 blur-[100px] rounded-full pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-100 group transition-colors cursor-pointer"
                >
                    <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                    Back to Home
                </button>

                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow shadow-violet-600/30">
                        <Video size={13} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-zinc-300">Apna Video Call</span>
                </div>
            </header>

            {/* Main */}
            <main className="relative z-10 flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-[#0d0d14] border border-zinc-800 rounded-2xl p-8 shadow-2xl shadow-black/40">

                        {/* Title */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 mb-4">
                                <UserCheck size={22} className="text-violet-400" />
                            </div>
                            <h1 className="text-2xl font-black tracking-tight text-white mb-1.5">Create account</h1>
                            <p className="text-sm text-zinc-600">Join and start hosting video meetings</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Full Name */}
                            <div>
                                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-700 pointer-events-none">
                                        <UserCheck size={15} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Your full name"
                                        value={form.name}
                                        onChange={set('name')}
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                                    Username
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-700 pointer-events-none">
                                        <User size={15} />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Choose a unique username"
                                        value={form.username}
                                        onChange={set('username')}
                                        className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-[11px] font-semibold text-zinc-600 uppercase tracking-widest mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-700 pointer-events-none">
                                        <Lock size={15} />
                                    </span>
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="Create a strong password"
                                        value={form.password}
                                        onChange={set('password')}
                                        className="w-full pl-10 pr-11 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition text-sm font-medium"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-600 hover:text-zinc-300 transition cursor-pointer"
                                    >
                                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full mt-2 py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 active:scale-[0.98] transition-all text-sm flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Create Account →'}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="my-6 flex items-center gap-3">
                            <div className="flex-1 h-px bg-zinc-800" />
                            <span className="text-xs text-zinc-700 font-semibold">OR</span>
                            <div className="flex-1 h-px bg-zinc-800" />
                        </div>

                        {/* Login link */}
                        <p className="text-center text-sm text-zinc-600">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-violet-400 hover:text-violet-300 font-semibold transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 text-center py-5 text-xs text-zinc-800 border-t border-zinc-900/60">
                © {new Date().getFullYear()} Apna Video Call
            </footer>
        </div>
    );
};

export default RegisterPage;