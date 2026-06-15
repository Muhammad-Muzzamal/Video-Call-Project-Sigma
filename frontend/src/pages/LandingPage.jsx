import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Video, Keyboard, ArrowRight, Shield, Sparkles, LogOut, Users, Globe, Mic } from 'lucide-react';
import toast from 'react-hot-toast';

const LandingPage = () => {
    const navigate = useNavigate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const [meetingCode, setMeetingCode] = useState('');

    const handleCreate = () => {
        const rand = () => Math.random().toString(36).substring(2, 5);
        navigate(`/${rand()}-${Math.random().toString(36).substring(2, 6)}-${rand()}`);
    };

    const handleJoin = (e) => {
        e.preventDefault();
        const input = meetingCode.trim();
        if (!input) return;
        try {
            if (input.includes('://') || input.includes('localhost') || input.startsWith('http')) {
                const url = new URL(input.startsWith('http') ? input : `https://${input}`);
                const code = url.pathname.replace(/^\//, '');
                if (code) { navigate(`/${code}`); toast.success('Joining via link!'); }
                else toast.error('Invalid meeting link.');
            } else {
                navigate(`/${input}`);
                toast.success('Joining meeting...');
            }
        } catch {
            navigate(`/${input}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.success('Logged out successfully');
        window.location.reload();
    };

    const features = [
        { icon: Shield, label: 'End-to-End Encrypted' },
        { icon: Users, label: 'Multi-Peer Support' },
        { icon: Globe, label: 'No Download Needed' },
    ];

    return (
        <div className="min-h-screen bg-[#08080f] text-zinc-100 flex flex-col relative overflow-hidden font-sans">

            {/* Ambient background glows */}
            <div className="absolute top-[-5%] left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-violet-900/12 blur-[140px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[5%] right-[-5%] w-[450px] h-[450px] bg-indigo-900/8 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-[50%] left-[-10%] w-[300px] h-[300px] bg-violet-800/5 blur-[100px] rounded-full pointer-events-none" />

            {/* ── Header ───────────────────────────────────────────── */}
            <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
                {/* Logo */}
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30 border border-violet-500/20">
                        <Video size={17} className="text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-white">
                        Apna <span className="text-violet-400">Video</span> Call
                    </span>
                </div>

                {/* Nav */}
                <nav className="flex items-center gap-3">
                    {token ? (
                        <>
                            <button
                                onClick={handleCreate}
                                className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/20 border border-violet-500/20 text-sm cursor-pointer"
                            >
                                <Plus size={15} /> New Meeting
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 px-4 py-2.5 rounded-xl transition-all text-sm font-semibold cursor-pointer"
                            >
                                <LogOut size={14} /> Log Out
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm text-zinc-400 hover:text-zinc-100 font-semibold px-4 py-2 transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="text-sm bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold px-4 py-2.5 rounded-xl transition-all"
                            >
                                Sign Up
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* ── Hero + Actions ────────────────────────────────────── */}
            <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col lg:flex-row items-center justify-center gap-14">

                {/* Left: Hero copy + CTAs */}
                <div className="flex-1 max-w-xl space-y-7 text-center lg:text-left">

                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-violet-950/60 border border-violet-800/40 rounded-full text-xs text-violet-300 font-semibold">
                        <Sparkles size={12} className="animate-pulse" />
                        Seamless peer-to-peer video calling
                    </div>

                    {/* Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                        Premium video calls.
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400">
                            Free for everyone.
                        </span>
                    </h1>

                    {/* Subtext */}
                    <p className="text-base sm:text-lg text-zinc-500 font-medium leading-relaxed max-w-md mx-auto lg:mx-0">
                        A clean, secure WebRTC-powered video call experience. No installs. No accounts required to join.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 justify-center lg:justify-start">
                        <button
                            onClick={handleCreate}
                            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold px-7 py-3.5 rounded-xl transition-all shadow-xl shadow-violet-600/25 text-sm cursor-pointer border border-violet-500/20 active:scale-[0.98]"
                        >
                            <Plus size={18} />
                            Start Instant Meeting
                        </button>

                        <div className="hidden sm:block h-8 w-px bg-zinc-800" />

                        {/* Join form */}
                        <form onSubmit={handleJoin} className="w-full sm:w-auto flex items-center gap-2">
                            <div className="relative flex-1 sm:w-64">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-600">
                                    <Keyboard size={15} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Meeting code or link..."
                                    value={meetingCode}
                                    onChange={(e) => setMeetingCode(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 rounded-xl text-zinc-200 placeholder-zinc-700 text-sm font-medium transition outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-5 py-3.5 rounded-xl transition-all font-semibold text-sm shrink-0 cursor-pointer"
                            >
                                Join <ArrowRight size={15} />
                            </button>
                        </form>
                    </div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start pt-2">
                        {features.map(({ icon: Icon, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-xs text-zinc-600 font-semibold">
                                <Icon size={13} className="text-violet-600/70" />
                                {label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right: Animated mock call UI */}
                <div className="w-full lg:w-[45%] max-w-md">
                    <img
                        src="/landing_page_image.jpg"
                        alt="Landing"
                        
                    />
                </div>
            </main>

            {/* ── Footer ───────────────────────────────────────────── */}
            <footer className="relative z-10 w-full text-center py-5 text-xs text-zinc-800 border-t border-zinc-900/60">
                © {new Date().getFullYear()} Apna Video Call · Built with WebRTC
            </footer>
        </div>
    );
};

export default LandingPage;