import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'

const LandingPage = () => {
    const navigate = useNavigate();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const handleCreate = () => navigate('/default');
    return (
        <div className="landing-page relative h-screen bg-[url('/1.jpg')] bg-cover bg-center">
            <div className="relative z-10 h-full flex flex-col bg-white/30 backdrop-blur-sm">
                <nav className='flex justify-between px-20 py-5'>
                    <div className='text-3xl font-bold text-gray-900'>Apna Video Call</div>
                    <ul className='flex items-center gap-6 text-gray-900'>
                        {token ? (
                            <li>
                                <button onClick={handleCreate} className='flex items-center gap-2 bg-purple-200 text-purple-900 px-3 py-2 rounded-lg'>
                                    <Plus size={16} /> Create
                                </button>
                            </li>
                        ) : (
                            <>
                                <li className='cursor-pointer'><Link to={''} className='hover:text-purple-700'>Join as Guest</Link></li>
                                <li className='cursor-pointer'><Link to={'/register'} className='hover:text-purple-700'>Register</Link></li>
                                <li className='cursor-pointer'><Link to={'/login'} className='hover:text-purple-700'>Login</Link></li>
                            </>
                        )}
                    </ul>
                </nav>

                <div className="flex items-center justify-center flex-1 px-20">
                    <div className="flex flex-row-reverse items-center gap-10 w-full">
                        <div className='flex-1 bg-white/95 border border-gray-200 rounded-3xl p-10 shadow-lg'>
                            <h1 className='text-5xl font-bold text-gray-900 mb-4'>
                                <span className='text-purple-700'>Connect</span> with your loved ones
                            </h1>
                            <p className='text-lg text-gray-700 mb-8'>A simple, secure video call experience for friends, family, and teams.</p>
                            <button className='bg-purple-200 text-purple-900 py-3 px-6 rounded-full text-lg font-semibold'>Get Started</button>
                        </div>

                        <div className='w-[35%] min-w-[320px] rounded-3xl overflow-hidden border border-gray-200 shadow-lg'>
                            <img src="/landing_page_image.jpg" alt="Video call illustration" className='w-full h-full object-cover' />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LandingPage