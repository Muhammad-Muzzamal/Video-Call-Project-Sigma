import React, { useEffect, useRef, useState } from 'react'


// ============================================
// CONFIGURATION - SAB SE PEHLE
// ============================================
const server_url = "http://localhost:3000"

const connections = {}
const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

const connections = {}

// ============================================
// COMPONENT START
// ============================================

// ── Voice Activity Detector ──────────────────────────────────────────────────
const useVoiceActivity = (stream) => {
    const [speaking, setSpeaking] = useState(false);
    const analyserRef = useRef(null);
    const rafRef = useRef(null);
    const contextRef = useRef(null);

    useEffect(() => {
        if (!stream) return;
        const audioTracks = stream.getAudioTracks();
        if (!audioTracks.length) return;

        const ctx = new AudioContext();
        contextRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyserRef.current = analyser;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        const check = () => {
            analyser.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length;
            setSpeaking(avg > 10);
            rafRef.current = requestAnimationFrame(check);
        };
        check();

        return () => {
            cancelAnimationFrame(rafRef.current);
            ctx.close();
        };
    }, [stream]);

    return speaking;
};

// ── Remote Video Card ────────────────────────────────────────────────────────
const RemoteVideo = ({ videoData, index, isSolo }) => {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && videoData.stream) {
            ref.current.srcObject = videoData.stream;
        }
    }, [videoData.stream]);

    return (
        <div className={`relative bg-gray-900 rounded-2xl overflow-hidden shadow-xl border border-gray-700 ${isSolo ? 'h-full w-full' : 'min-h-[180px]'}`}>
            <video
                ref={ref}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${videoData.speaking ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
                <span className="bg-black/60 text-white px-3 py-1 rounded-lg text-sm">
                    {videoData.username || `Participant ${index + 1}`}
                </span>
            </div>
        </div>
    );
};

// ── Main Component ───────────────────────────────────────────────────────────
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
        return () => {
            Object.values(connectionsRef.current).forEach(pc => pc.close());
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenStreamRef.current?.getTracks().forEach(t => t.stop());
            socketRef.current?.disconnect();
        };
    }, []);

    // ── Layout logic ───────────────────────────────────────────────────────
    const isSolo = videos.length === 0; // only local user present

    const gridClass = isSolo
        ? 'flex items-center justify-center'
        : videos.length === 1
        ? 'grid grid-cols-2 gap-4'
        : videos.length <= 3
        ? 'grid grid-cols-2 gap-4'
        : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4';

    // ── Render ─────────────────────────────────────────────────────────────
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
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
                    <div className="bg-gray-900 p-6 rounded-2xl max-w-sm w-full border border-gray-700 shadow-2xl">
                        <p className="text-white mb-5 text-sm leading-relaxed whitespace-pre-wrap">{modalMessage}</p>
                        <button onClick={() => setShowModal(false)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition font-semibold">
                            OK
                        </button>
                    </div>
                </div>
            )}

            {/* Connecting overlay */}
            {isConnecting && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
                        <p className="text-white">Joining meeting…</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoMeet;