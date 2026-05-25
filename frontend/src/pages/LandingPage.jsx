import React from 'react'
import "../css/landingPage.css"

const LandingPage = () => {
    return (
        <div className='landingPageContainer'>
            <nav>
                <div className='nav-header'><h2>MuzzamalDev video Call</h2></div>
                <div className='nav-list'>
                    <p>join as guest</p>
                    <p>Register</p>
                    <div role='button'>
                        <p>Login</p>
                    </div>
                </div>
            </nav>


            {/* Landing Main Container */}
            <div className="landingMainContainer">
                <div className="landing-main-content">
                    <h2><span>Connect</span> with your LOved Ones</h2>
                    <p>Cover a distance by MuzzamalDev video call</p>
                    <button type='button'>Set Started</button>
                </div>
                <div className="landing-main-image">
                    <img src="public/landing_page_image.jpg" alt="" />
                </div>
            </div>
        </div>
    )
}

export default LandingPage