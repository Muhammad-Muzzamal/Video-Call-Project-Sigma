import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, User } from 'lucide-react';
import api from '../config/api.config.js';
import toast from 'react-hot-toast';
import { useNavigate, Link, useLocation } from 'react-router-dom';

const LoginPage = () => {
    const navigate = useNavigate()
    const location = useLocation();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [loading, setLoading] = useState(false)

    // Plug your custom login handler here
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)

        try {
            const response = await api.post("/auth/login", formData)

            if (response.data?.status_code === 200 || response.status === 200) {
                const token = response.data?.data?.user?.token || response.data?.data?.token || response.data?.token;
                const user = response.data?.data?.user || response.data?.data || null;
                if (token) localStorage.setItem("token", token);
                if (user) localStorage.setItem("user", JSON.stringify(user));

                toast.success("Login successful.");

                setTimeout(() => {
                    const dest = location.state?.from || "/default";
                    navigate(dest);
                }, 700);
            } else {
                toast.error(response.data?.message || "Something went wrong.");
            }

        } catch (error) {
            // console.log(error.response.status)
            if (error.response) {
                if (error.response.status === 404) {
                    toast.error("User not found.")
                } else {
                    toast.error("Internal Server Error")
                }
            } else {
                toast.error("Check your Connection")

            }

        } finally {
            setLoading(false)
        }

        setLoading(false)


    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between relative overflow-hidden font-sans">

            {/* Ambient Deep Purple Glow matching the theme in image_41acda.jpg */}
            <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[900px] h-[240px] bg-gradient-to-r from-purple-200/40 via-purple-100/30 to-purple-200/30 blur-[80px] rounded-full pointer-events-none" />

            {/* Header Navigation */}
            <header className="w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center z-10">
                {/* Back Navigator */}
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors group"
                >
                    <ArrowLeft size={18} className="transform group-hover:-translate-x-1 transition-transform" />
                    <span>Back to Home</span>
                </button>

                {/* Brand Name */}
                <div className="text-xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                    Apna Video Call
                </div>
            </header>

            {/* Main Login UI */}
            <main className="flex-1 flex items-center justify-center p-6 z-10">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">

                    {/* Card Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-gray-600">
                            Log in to your account to continue
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLoginSubmit} className="space-y-5">

                        {/* 1. Username Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Username
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter your username"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                                    required
                                    name='username'
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, username: e.target.value }))
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. Password Field */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    Password
                                </label>
                                {/* TODO */}
                                {/* <a href="#forgot" className="text-xs text-purple-400 hover:underline">
                  Forgot?
                </a> */}
                            </div>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                                    required
                                    name='password'
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, password: e.target.value }))
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <button
                            type="submit"
                            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-purple-200 to-purple-300 hover:from-purple-100 hover:to-purple-300 text-purple-900 font-medium rounded-xl shadow active:scale-[0.99] transition-all text-sm flex justify-center items-center"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className='animate-spin' /> : <span>Sign In</span>}
                        </button>
                    </form>

                    {/* Register Link Footer */}
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            className="text-purple-600 font-medium hover:text-purple-500 transition-colors ml-1"
                        >
                            Register here
                        </Link>
                    </div>

                </div>
            </main>

            {/* Footer spacer */}
            <footer className="w-full text-center py-6 text-xs text-gray-600 z-10">
                &copy; {new Date().getFullYear()} Apna Video Call. All rights reserved.
            </footer>
        </div>
    );
};

export default LoginPage;