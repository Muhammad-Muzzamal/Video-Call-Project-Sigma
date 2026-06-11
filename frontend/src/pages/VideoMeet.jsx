import React, { useEffect, useRef, useState } from 'react'


const server_url = "http://localhost:3000"

const connections = {}
const peerConfigConnections = {
    "iceServers": [
        { "url": "stun:stun.l.google.com:19302" }
    ]
}

const VideoMeet = () => {

    const socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    const [videoAvaiable, setVideoAvaiable] = useState(true)
    const [audioAvailable, setAudioAvailable] = useState(true)

    const [video, setVideo] = useState()
    const [audio, setAudio] = useState()

    const [showModel, setShowModel] = useState()
    const [screenAvailable, setscreenAvailable] = useState()

    const [messages, setMessages] = useState([])
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true)
    const [username, setUsername] = useState("")

    const videoRef = useRef([])
    const [videos, setVideos] = useState([])

    // TODO : implement chrominum feature
    // if(isChrome() === false) {

    // }

    const getPermission = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true })

            if (videoPermission) {
                setVideoAvaiable(true)
            } else {
                setVideoAvaiable(false)
            }
            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true })

            if (audioPermission) {
                setAudioAvailable(true)
            } else {
                setAudioAvailable(false)
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setscreenAvailable(true)
            } else {
                setscreenAvailable(false)
            }

            if (videoAvaiable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({
                    video: videoAvaiable,
                    audio: audioAvailable
                })

                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    }
                }

            }

        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getPermission();
    }, [])


    let getUserMediaSuccess = (stream) => {
        
    }
 
    const getUserMedia = () => {
        if ((video && videoAvaiable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(() => { })
                .then((stream) => { })
                .catch(error => console.log(error))
        } else {
            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
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
                            <video ref={localVideoRef} autoPlay muted></video>
                        </div>
                    </div> :
                    <></>
            }
        </div>
    )
}

export default VideoMeet