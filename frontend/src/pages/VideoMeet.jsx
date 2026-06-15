import React, { useEffect, useRef, useState } from 'react'
import { io } from "socket.io-client"


// ============================================
// CONFIGURATION - SAB SE PEHLE
// ============================================
const server_url = "http://localhost:3000"
const peerConfigConnections = {
    "iceServers": [
        { "url": "stun:stun.l.google.com:19302" }
    ]
}

const connections = {}

// ============================================
// COMPONENT START
// ============================================

const VideoMeet = () => {


    // ============================================
    // STEP 1: ALL STATE VARIABLES
    // ============================================

    // socket reference
    const socketRef = useRef(); 
    let socketIdRef = useRef(); 

    let localVideoRef = useRef(); // local video call reference

    const [videoAvaiable, setVideoAvaiable] = useState(true); // camera position status
    const [audioAvailable, setAudioAvailable] = useState(true) // Microphone permission status

    const [video, setVideo] = useState()
    const [audio, setAudio] = useState()

    const [showModel, setShowModel] = useState() // model show and hide like chat 
    const [screenAvailable, setscreenAvailable] = useState()

    const [messages, setMessages] = useState([]) // chat message array
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true) // show username input dialog
    const [username, setUsername] = useState("") // current user name

    const videoRef = useRef([]) // array of remote video element
    const [videos, setVideos] = useState([]) // remote video streams array

    // TODO : implement chrominum feature
    // if(isChrome() === false) {

    // }

    /**
     * @function getPermission()
     * 
     * this function do following tasks
     * 1. Check camera permission
     * 2. Check microphone Permission
     * 3. Check screen sharing check
     * 4. Start local stream
     */
    const getPermission = async () => {
        try {
            let hasVideo = false;
            let hasAudio = false;
            let stream = null;

            // Try 1: Dono ek saath try karo
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                hasVideo = true;
                hasAudio = true;
                console.log("Both video and audio granted");
            } catch (err) {
                console.log("Both not granted, trying individually...");

                // Try 2: Sirf video try karo
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                    hasVideo = true;
                    hasAudio = false;
                    console.log("Only video granted");
                } catch (videoErr) {
                    console.log("Video not granted");

                    // Try 3: Sirf audio try karo
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({
                            video: false,
                            audio: true
                        });
                        hasVideo = false;
                        hasAudio = true;
                        console.log("Only audio granted");
                    } catch (audioErr) {
                        console.log("No permissions granted");
                        hasVideo = false;
                        hasAudio = false;
                    }
                }
            }

            // Update states
            setVideoAvaiable(hasVideo);
            setAudioAvailable(hasAudio);

            // Check screen sharing
            if (navigator.mediaDevices.getDisplayMedia) {
                setscreenAvailable(true);
            } else {
                setscreenAvailable(false);
            }

            // Set stream if we got one
            if (stream) {
                window.localStream = stream;
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } else {
                // No permissions at all
                console.log("User denied all permissions");
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = null;
                }
            }

        } catch (error) {
            console.error("Error in getPermission:", error);
            setVideoAvaiable(false);
            setAudioAvailable(false);
        }
    };

    useEffect(() => {
        getPermission();
    }, [])


    let getUserMediaSuccess = (stream) => {

    }

    const getUserMedia = () => {
        if ((video && videoAvaiable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then((stream) => {
                    window.localStream = stream;

                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = stream;
                    }

                    // 
                })
                .catch(error => console.log(error))
        } else {
            try {
                if (localVideoRef.current && localVideoRef.current.srcObject) {

                    let tracks = localVideoRef.current.srcObject.getTracks()
                    tracks.forEach(track => track.stop())

                    localVideoRef.current.srcObject = null;

                    window.localStream = null;
                }
            } catch (error) {

            }
        }
    }

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video])

    let getMedia = () => {
        setVideo(videoAvaiable)
        setAudio(audioAvailable)

    }


    return (
        <div>
            {
                askForUsername === true ?
                    <div>
                        <h2>Enter into Lobby</h2>
                        <input
                            className='outline rounded-full'
                            type="text"
                            name="username"
                            id="username"
                            value={username}
                            onChange={(e) => { setUsername(e.target.value) }} />

                        <button className='bg-blue-400 px-3 py-1 rounded-full text-white'>Connect</button>

                        <div>
                            <video ref={localVideoRef} autoPlay ></video>
                        </div>
                    </div> :
                    <></>
            }
        </div>
    )
}

export default VideoMeet