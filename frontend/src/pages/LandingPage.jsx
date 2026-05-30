import React from 'react'

const LandingPage = () => {
    return (
        /* Added bg-[url('/1.jpg')] bg-cover bg-no-repeat bg-center */
        <div className="landing-page h-screen bg-[linear-gradient(to_bottom,rgba(0,0,0,0.5),rgba(0,0,0,0.5)),url('/1.jpg')] bg-cover bg-no-repeat bg-center">
            <nav className='flex justify-between px-20 py-5'>
                <div className='text-3xl font-bold text-[#B599EB]'>Apna Video Call</div>
                <ul className='flex items-center gap-10 text-white'>
                    <li className='cursor-pointer'>Join as Guest</li>
                    <li className='cursor-pointer'>Register</li>
                    <li className='cursor-pointer'>Login</li>
                </ul>
            </nav>
            <div className="flex justify-between items-center px-50">

                <div className='text-white space-y-4'>
                    <div className='text-5xl font-bold'>
                        <span className='text-[#B599EB]'>Connect</span> with your loved Ones
                    </div>
                    <div className='text-2xl'>
                        Cover a distance by Apna Video Call
                    </div>
                    <button className='bg-[#B599EB] text-black py-2 px-4 rounded-3xl text-xl'>Get Started</button>
                </div>

                {/* image */}
                <div className='w-[30vw]'>
                    <img src="/landing_page_image.jpg" alt="" />
                </div>
            </div>

        </div>
    )
}

export default LandingPage