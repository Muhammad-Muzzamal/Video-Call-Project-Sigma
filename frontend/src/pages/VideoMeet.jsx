import React, { useEffect, useRef, useState, useCallback } from 'react'
import { io } from "socket.io-client"
import { Copy, Video, Mic, Monitor, MessageSquare, LogOut, User } from 'lucide-react';

const server_url = "http://localhost:3000"

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302" }
    ]
}

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
    const socketRef = useRef(null);
    const socketIdRef = useRef(null);
    const localVideoRef = useRef(null);
    const pipVideoRef = useRef(null);
    const connectionsRef = useRef({});
    const localStreamRef = useRef(null);
    const screenStreamRef = useRef(null);

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(true);
    const [audio, setAudio] = useState(true);
    const [screenAvailable, setScreenAvailable] = useState(false);
    const [screen, setScreen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessages, setNewMessages] = useState(0);
    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");
    const [messageInput, setMessageInput] = useState("");
    const [showChat, setShowChat] = useState(false);
    const [videos, setVideos] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const [isConnecting, setIsConnecting] = useState(false);
    const [inviteCopied, setInviteCopied] = useState(false);
    const [localStream, setLocalStream] = useState(null);

    const localSpeaking = useVoiceActivity(localStream);

    // ── Meeting link ───────────────────────────────────────────────────────
    const meetingLink = typeof window !== 'undefined' ? window.location.href : '';

    const copyInviteLink = async () => {
        try {
            await navigator.clipboard.writeText(meetingLink);
            setInviteCopied(true);
            setTimeout(() => setInviteCopied(false), 2500);
        } catch {
            setModalMessage("Could not copy link. Share this URL manually:\n" + meetingLink);
            setShowModal(true);
        }
    };

    // ── Permissions & local media ──────────────────────────────────────────
    const getPermissions = async () => {
        try {
            let hasVideo = false, hasAudio = false;
            try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop()); hasVideo = true; } catch {}
            try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); hasAudio = true; } catch {}
            setVideoAvailable(hasVideo);
            setAudioAvailable(hasAudio);
            setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);
            if (hasVideo || hasAudio) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: hasVideo, audio: hasAudio });
                localStreamRef.current = stream;
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            }
        } catch {
            setModalMessage("Unable to access camera/microphone.");
            setShowModal(true);
        }
    };

    useEffect(() => { getPermissions(); }, []);

    // If user already logged in, prefill name and auto-join
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const u = JSON.parse(userStr);
                const name = u.name || u.username || '';
                if (name) setUsername(name);
                // delay slightly to allow state to update
                setTimeout(() => { if (name) joinMeeting(); }, 300);
            } catch (e) { }
        }
    }, []);

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream, askForUsername]);

    const handleUserMedia = async () => {
        try {
            if ((video && videoAvailable) || (audio && audioAvailable)) {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: video && videoAvailable,
                    audio: audio && audioAvailable
                });
                localStreamRef.current = stream;
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
                Object.values(connectionsRef.current).forEach(pc => {
                    const senders = pc.getSenders();
                    stream.getTracks().forEach(track => {
                        const sender = senders.find(s => s.track?.kind === track.kind);
                        if (sender) sender.replaceTrack(track);
                    });
                });
            } else {
                localStreamRef.current?.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
                setLocalStream(null);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        if (!askForUsername) handleUserMedia();
    }, [video, audio]);

    // ── WebRTC ─────────────────────────────────────────────────────────────
    const createPeerConnection = (socketId, isInitiator = false) => {
        if (connectionsRef.current[socketId]) return connectionsRef.current[socketId];
        const pc = new RTCPeerConnection(peerConfigConnections);
        connectionsRef.current[socketId] = pc;
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => pc.addTrack(track, localStreamRef.current));
        }
        pc.onicecandidate = ({ candidate }) => {
            if (candidate) socketRef.current.emit('signal', { to: socketId, type: 'ice-candidate', candidate });
        };
        pc.ontrack = ({ streams: [remoteStream] }) => addRemoteVideo(socketId, remoteStream);
        const cleanup = () => { removeVideo(socketId); delete connectionsRef.current[socketId]; };
        pc.onconnectionstatechange = () => { if (['disconnected','failed','closed'].includes(pc.connectionState)) cleanup(); };
        pc.oniceconnectionstatechange = () => { if (['disconnected','failed'].includes(pc.iceConnectionState)) cleanup(); };
        if (isInitiator) createOffer(pc, socketId);
        return pc;
    };

    const createOffer = async (pc, socketId) => {
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socketRef.current.emit('signal', { to: socketId, type: 'offer', sdp: pc.localDescription });
        } catch (e) { console.error(e); }
    };

    const handleSignal = async (fromId, data) => {
        try {
            const pc = connectionsRef.current[fromId] || createPeerConnection(fromId);
            if (data.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socketRef.current.emit('signal', { to: fromId, type: 'answer', sdp: pc.localDescription });
            } else if (data.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
            } else if (data.type === 'ice-candidate' && data.candidate) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
            }
        } catch (e) { console.error(e); }
    };

    const addRemoteVideo = (socketId, stream) => {
        setVideos(prev => {
            const exists = prev.find(v => v.socketId === socketId);
            if (exists) return prev.map(v => v.socketId === socketId ? { ...v, stream } : v);
            return [...prev, { socketId, stream, username: '' }];
        });
    };

    const removeVideo = (socketId) => {
        setVideos(prev => prev.filter(v => v.socketId !== socketId));
        connectionsRef.current[socketId]?.close();
        delete connectionsRef.current[socketId];
    };

    // ── Chat ───────────────────────────────────────────────────────────────
    const addMessage = (data) => {
        setMessages(prev => [...prev, {
            ...data,
            timestamp: data.timestamp || new Date().toISOString(),
            mine: data.mine || data.socketId === socketIdRef.current
        }]);
        if (!showChat && !data.mine) setNewMessages(n => n + 1);
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !socketRef.current) return;
        const msg = { username, message: messageInput.trim(), timestamp: new Date().toISOString() };
        socketRef.current.emit('chat-message', msg);
        addMessage({ ...msg, mine: true, socketId: socketIdRef.current });
        setMessageInput("");
    };

    // ── Screen share with PiP ──────────────────────────────────────────────
    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            screenStreamRef.current = screenStream;
            const videoTrack = screenStream.getVideoTracks()[0];
            Object.values(connectionsRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(videoTrack);
            });
            if (localVideoRef.current) localVideoRef.current.srcObject = screenStream;
            // PiP: show camera in corner
            if (pipVideoRef.current && localStreamRef.current) {
                pipVideoRef.current.srcObject = localStreamRef.current;
            }
            videoTrack.onended = stopScreenShare;
            setScreen(true);
        } catch (e) {
            setModalMessage("Failed to share screen. Please try again.");
            setShowModal(true);
        }
    };

    const stopScreenShare = () => {
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        if (localStreamRef.current && localVideoRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                Object.values(connectionsRef.current).forEach(pc => {
                    const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                    if (sender) sender.replaceTrack(videoTrack);
                });
            }
        }
        if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
        setScreen(false);
    };

    // ── Socket ─────────────────────────────────────────────────────────────
    const connectToSocketServer = () => {
        socketRef.current?.disconnect();
        setIsConnecting(true);
        socketRef.current = io.connect(server_url, { secure: false, reconnection: true, reconnectionAttempts: 5 });
        socketRef.current.on("signal", handleSignal);
        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
            setIsConnecting(false);
            socketRef.current.emit("join-call", { roomId: window.location.pathname || '/default', username });
            socketRef.current.on("chat-message", addMessage);
            socketRef.current.on("user-left", removeVideo);
            socketRef.current.on("user-joined", (data) => {
                if (data.id !== socketIdRef.current) createPeerConnection(data.id, true);
                // Update username in videos list
                if (data.username) {
                    setVideos(prev => prev.map(v => v.socketId === data.id ? { ...v, username: data.username } : v));
                }
            });
        });
        socketRef.current.on("disconnect", () => setIsConnecting(false));
        socketRef.current.on("connect_error", () => {
            setIsConnecting(false);
            setModalMessage("Failed to connect. Check your connection and try again.");
            setShowModal(true);
        });
    };

    const joinMeeting = async () => {
        if (!username.trim()) return;
        setAskForUsername(false);
        await handleUserMedia();
        connectToSocketServer();
    };

    const leaveMeeting = () => {
        Object.values(connectionsRef.current).forEach(pc => pc.close());
        connectionsRef.current = {};
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        setLocalStream(null);
        screenStreamRef.current?.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
        socketRef.current?.disconnect();
        socketRef.current = null;
        setVideos([]); setMessages([]); setNewMessages(0);
        setAskForUsername(true); setShowChat(false); setScreen(false);
    };

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
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* ── JOIN SCREEN ── */}
            {askForUsername ? (
                <div className="min-h-screen p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto flex gap-6 items-start">
                        <aside className="w-80 bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Meeting</h3>
                            <div className="text-sm text-gray-700 mb-3 break-all">{meetingLink}</div>
                            <div className="flex gap-2 mb-3">
                                <button onClick={copyInviteLink} className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded">
                                    <Copy size={16} /> Copy
                                </button>
                            </div>
                            <label className="block text-xs text-gray-600 mb-1">Your name</label>
                            <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" className="w-full border p-2 rounded mb-3 text-gray-900" />
                            <button onClick={joinMeeting} disabled={!username.trim() || isConnecting} className="w-full bg-purple-200 text-purple-900 p-2 rounded flex items-center justify-center gap-2" >
                                <Video size={16} /> {isConnecting ? 'Connecting…' : 'Join Meeting'}
                            </button>
                        </aside>

                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center">
                            <div className="w-full h-72 bg-black rounded overflow-hidden">
                                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                            </div>
                        </div>
                    </div>
                </div>

            ) : (
                /* ── MEETING SCREEN ── */
                <div className="min-h-screen p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto flex gap-6 h-[calc(100vh-4rem)]">
                        <aside className="w-80 bg-white border border-gray-200 rounded-lg p-4 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Meeting</h3>
                                <div className="text-sm text-gray-600">{videos.length + 1}</div>
                            </div>

                            <div className="text-sm text-gray-700 mb-3 break-all">{meetingLink}</div>
                            <div className="flex gap-2 mb-3">
                                <button onClick={copyInviteLink} className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-800 rounded">
                                    <Copy size={16} /> Copy
                                </button>
                            </div>

                            <div className="flex gap-2 mb-3">
                                <button onClick={() => { setShowChat(!showChat); setNewMessages(0); }} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded">
                                    <MessageSquare size={16} /> Chat
                                </button>
                                <button onClick={() => startScreenShare()} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-800 rounded">
                                    <Monitor size={16} /> Share
                                </button>
                            </div>

                            <div className="mt-auto">
                                <button onClick={leaveMeeting} className="w-full flex items-center gap-2 justify-center bg-red-600 text-white py-2 rounded">
                                    <LogOut size={16} /> Leave
                                </button>
                            </div>
                        </aside>

                        <main className="flex-1 flex flex-col">
                            <div className="flex-1 p-4 overflow-hidden">
                                <div className={`${gridClass} h-full gap-4`}>

                                    {/* Local video */}
                                    <div className={`relative bg-white rounded-2xl overflow-hidden shadow border transition-all
                                        ${localSpeaking ? 'border-green-500 shadow-green-200/40' : 'border-gray-200'}
                                        ${isSolo ? 'w-full max-w-3xl aspect-video' : 'min-h-[180px]'}`}>

                                        <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

                                        {!video && !screen && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                                                <div className="h-16 w-16 rounded-full bg-purple-200 flex items-center justify-center text-2xl font-bold text-purple-800 mb-2">
                                                    {username.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-gray-600 text-sm">Camera off</span>
                                            </div>
                                        )}

                                        {/* PiP camera during screen share */}
                                        {screen && (
                                            <div className="absolute bottom-3 right-3 w-28 aspect-video rounded-xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-gray-950">
                                                <video ref={pipVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                                            </div>
                                        )}

                                        {/* Label */}
                                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                            {localSpeaking && <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />}
                                            <span className="bg-white/80 text-gray-900 px-3 py-1 rounded-lg text-sm backdrop-blur-sm">You {screen ? '· Sharing screen' : ''}</span>
                                        </div>

                                    </div>

                                    {/* Remote videos */}
                                    {videos.map((v, i) => (
                                        <RemoteVideo key={v.socketId} videoData={v} index={i} isSolo={videos.length === 1 && false} />
                                    ))}
                                </div>
                            </div>
                        </main>
                    </div>

                    {/* Chat panel */}
                    {showChat && (
                        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg border-l border-gray-200 flex flex-col z-50">
                            <div className="p-4 bg-white flex justify-between items-center border-b border-gray-200">
                                <h3 className="text-gray-900 font-bold">Chat</h3>
                                <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-gray-800 p-1 rounded-lg transition">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {messages.length === 0 ? (
                                    <div className="text-center text-gray-600 mt-12 text-sm">No messages yet.<br />Say hello! 👋</div>
                                ) : messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.mine ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.mine ? 'bg-purple-200 text-purple-900 rounded-br-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'}`}>
                                            <div className="text-xs opacity-60 mb-1 font-semibold">{msg.mine ? 'You' : msg.username}</div>
                                            <div className="break-words leading-relaxed">{msg.message}</div>
                                            <div className="text-xs opacity-40 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-200">
                                <div className="flex gap-2">
                                    <input type="text" value={messageInput} onChange={e => setMessageInput(e.target.value)} placeholder="Type a message…" className="flex-1 px-3 py-2 bg-gray-100 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 placeholder-gray-400 text-sm" />
                                    <button type="submit" disabled={!messageInput.trim()} className="bg-purple-200 text-purple-900 px-4 py-2 rounded-xl hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-semibold">Send</button>
                                </div>
                            </form>
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