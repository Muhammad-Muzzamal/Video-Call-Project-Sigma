import React, { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, User, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // 1. useNavigate Import karein
import api from '../config/api.config.js';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
    const navigate = useNavigate(); // 2. Hook initialize karein
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({ name: "", username: "", password: "" });

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.post("/auth/register", formData);
            console.log("Registration Success:", response);

            // Success alert message
            toast.success("Account created successfully!");

            // 3. 1.5 seconds delay ke baad /login par redirect karein taakay user toast dekh sakay
            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (error) {
            if (error.response) {
                if (error.response.status === 409 || error.response.status === 400) {
                    toast.error(error.response.data?.message || "Username is already taken.");
                } else {
                    toast.error(error.response.data?.message || "Internal Server Error.");
                }
            } else {
                toast.error("Check your Connection");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col justify-between relative overflow-hidden font-sans">

            {/* Subtle purple glow */}
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

            {/* Main Register UI Card */}
            <main className="flex-1 flex items-center justify-center p-6 z-10">
                <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">

                    {/* Card Title */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-2">
                            Create Account
                        </h1>
                        <p className="text-sm text-gray-600">
                            Join us and enjoy seamless high-quality video calls
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegisterSubmit} className="space-y-5">

                        {/* 1. Name Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Full Name
                            </label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-500">
                                    <UserCheck size={18} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                                    required
                                    name='name'
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, name: e.target.value }))
                                    }}
                                />
                            </div>
                        </div>

                        {/* 2. Username Field */}
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
                                    placeholder="Choose a username"
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200 transition-all text-sm"
                                    required
                                    name='username'
                                    value={formData.username}
                                    onChange={(e) => {
                                        setFormData((prev) => ({ ...prev, username: e.target.value }))
                                    }}
                                />
                            </div>
                        </div>

                        {/* 3. Password Field */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                Password
                            </label>
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
                                    value={formData.password}
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
                            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-purple-200 to-purple-300 hover:from-purple-100 hover:to-purple-300 text-purple-900 font-medium rounded-xl shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm flex justify-center items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? <Loader2 className='animate-spin' size={18} /> : <span>Sign Up</span>}
                        </button>
                    </form>

                    {/* Back to Login Link Footer */}
                    <div className="mt-6 text-center text-sm text-gray-400">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="text-purple-600 font-medium hover:text-purple-500 transition-colors ml-1"
                        >
                            Login here
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

export default RegisterPage;