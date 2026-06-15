import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import {
    Video, VideoOff, Mic, MicOff, Monitor, MonitorOff,
    MessageSquare, PhoneOff, Copy, Check, Users, Send, User, X,
    Bell, BellOff
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────
const SERVER_URL = 'http://localhost:3000';
const ICE_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

// ─────────────────────────────────────────────
// VOICE ACTIVITY HOOK
// ─────────────────────────────────────────────
const useVoiceActivity = (stream) => {
    const [speaking, setSpeaking] = useState(false);
    const rafRef   = useRef(null);
    const ctxRef   = useRef(null);
    const anlsRef  = useRef(null);

    useEffect(() => {
        if (!stream || stream.getAudioTracks().length === 0) { setSpeaking(false); return; }
        let audioCtx;
        try {
            audioCtx      = new (window.AudioContext || window.webkitAudioContext)();
            ctxRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            anlsRef.current = analyser;
            analyser.fftSize = 256;
            audioCtx.createMediaStreamSource(stream).connect(analyser);
            const buf = new Uint8Array(analyser.frequencyBinCount);
            const check = () => {
                if (!anlsRef.current) return;
                analyser.getByteFrequencyData(buf);
                setSpeaking(buf.reduce((a, b) => a + b, 0) / buf.length > 15);
                rafRef.current = requestAnimationFrame(check);
            };
            if (audioCtx.state === 'suspended') {
                const resume = () => { audioCtx.resume(); window.removeEventListener('click', resume); };
                window.addEventListener('click', resume);
            }
            rafRef.current = requestAnimationFrame(check);
        } catch (e) { console.error('AudioContext error:', e); }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            anlsRef.current = null;
            audioCtx?.close().catch(() => {});
            setSpeaking(false);
        };
    }, [stream]);

    return speaking;
};

// ─────────────────────────────────────────────
// REUSABLE CONTROL BUTTON
// ─────────────────────────────────────────────
const ControlBtn = ({ onClick, title, active, danger, className = '', children }) => (
    <button
        onClick={onClick}
        title={title}
        className={`relative p-3.5 rounded-2xl transition-all duration-200 cursor-pointer border focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
            danger
                ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'
                : active
                    ? 'bg-violet-600 hover:bg-violet-500 text-white border-violet-500/60 shadow-lg shadow-violet-500/25'
                    : 'bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 border-zinc-700/60 hover:text-white'
        } ${className}`}
    >
        {children}
    </button>
);

// ─────────────────────────────────────────────
// REMOTE VIDEO CARD
// ─────────────────────────────────────────────
const RemoteVideo = ({ participant, sizeClass }) => {
    const videoRef  = useRef(null);
    const isSpeaking = useVoiceActivity(participant.stream);

    useEffect(() => {
        if (videoRef.current && participant.stream) {
            videoRef.current.srcObject = participant.stream;
        }
    }, [participant.stream]);

    return (
        <div className={`relative bg-[#0d0d14] rounded-2xl overflow-hidden shadow-2xl border-2 flex items-center justify-center transition-all duration-300 ${sizeClass} ${
            isSpeaking ? 'border-emerald-500/60 shadow-emerald-500/10' : 'border-zinc-800/50'
        }`}>
            <video
                ref={videoRef}
                autoPlay playsInline
                className={`w-full h-full object-cover ${participant.videoEnabled && participant.stream ? 'block' : 'hidden'}`}
            />

            {/* Avatar placeholder */}
            {(!participant.videoEnabled || !participant.stream) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-violet-900/20 border border-violet-700/20 flex items-center justify-center">
                        <User size={26} className="text-violet-400/70" />
                    </div>
                    <span className="text-zinc-600 text-xs font-medium">Camera off</span>
                </div>
            )}

            {/* Bottom bar */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-white/10 truncate max-w-[70%]">
                    {participant.username || 'Participant'}
                </span>
                {!participant.audioEnabled && (
                    <span className="bg-red-500/90 text-white p-1.5 rounded-lg border border-red-400/20 flex items-center">
                        <MicOff size={10} />
                    </span>
                )}
            </div>

            {/* Speaking badge */}
            {isSpeaking && (
                <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase animate-pulse z-10">
                    Speaking
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// LOCAL VIDEO CARD
// ─────────────────────────────────────────────
const LocalVideoCard = ({ stream, videoEnabled, audioEnabled, username, screenSharing, sizeClass }) => {
    const videoRef   = useRef(null);
    const isSpeaking = useVoiceActivity(stream);
    const showVideo  = stream && (videoEnabled || screenSharing);

    // KEY: react when stream prop changes (displayStream state drives this)
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className={`relative bg-[#0d0d14] rounded-2xl overflow-hidden shadow-2xl border-2 flex items-center justify-center transition-all duration-300 ${sizeClass} ${
            isSpeaking ? 'border-emerald-500/60 shadow-emerald-500/10' : 'border-zinc-800/50'
        }`}>
            <video
                ref={videoRef}
                autoPlay playsInline muted
                className={`w-full h-full object-cover transition-all ${screenSharing ? '' : '-scale-x-100'} ${showVideo ? 'block' : 'hidden'}`}
            />

            {/* Avatar placeholder */}
            {!showVideo && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-violet-900/20 border border-violet-700/20 flex items-center justify-center">
                        <User size={26} className="text-violet-400/70" />
                    </div>
                    <span className="text-zinc-600 text-xs font-medium">Camera off</span>
                </div>
            )}

            {/* Screen share overlay */}
            {screenSharing && (
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-violet-600/90 backdrop-blur-sm px-2.5 py-1 rounded-lg z-10">
                    <Monitor size={11} className="text-white" />
                    <span className="text-white text-[10px] font-bold">Sharing</span>
                </div>
            )}

            {/* Bottom bar */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                <span className="bg-black/60 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-white/10 truncate max-w-[70%]">
                    {username || 'You'} <span className="text-zinc-400 font-normal">(Me)</span>
                </span>
                {!audioEnabled && (
                    <span className="bg-red-500/90 text-white p-1.5 rounded-lg border border-red-400/20 flex items-center">
                        <MicOff size={10} />
                    </span>
                )}
            </div>

            {/* Speaking badge */}
            {isSpeaking && (
                <div className="absolute top-2.5 right-2.5 bg-emerald-500 text-black px-2 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase animate-pulse z-10">
                    Speaking
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────
// MAIN VIDEOMEET COMPONENT
// ─────────────────────────────────────────────
const VideoMeet = () => {
    const { url } = useParams();
    const navigate = useNavigate();

    // User state
    const [username, setUsername]           = useState('');
    const [askForUsername, setAskForUsername] = useState(true);
    const [isConnecting, setIsConnecting]   = useState(false);

    // Media state
    const [videoEnabled, setVideoEnabled]   = useState(true);
    const [audioEnabled, setAudioEnabled]   = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);

    // ─── KEY FIX: displayStream is React state, drives LocalVideoCard re-renders ───
    const [displayStream, setDisplayStream] = useState(null);

    // UI state
    const [notifMuted, setNotifMuted]       = useState(false);
    const [showChat, setShowChat]           = useState(false);
    const [messages, setMessages]           = useState([]);
    const [chatInput, setChatInput]         = useState('');
    const [unread, setUnread]               = useState(0);
    const [copied, setCopied]               = useState(false);
    const [participants, setParticipants]   = useState([]);

    // Refs
    const socketRef      = useRef(null);
    const localStreamRef = useRef(null);
    const screenRef      = useRef(null);
    const connectionsRef = useRef({});
    const lobbyVideoRef  = useRef(null);  // only for lobby preview
    const messagesEndRef = useRef(null);

    // ── Notification chime ─────────────────────────────────────────────────
    const chime = () => {
        try {
            const ctx  = new (window.AudioContext || window.webkitAudioContext)();
            const osc  = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.07, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(); osc.stop(ctx.currentTime + 0.4);
        } catch (_) {}
    };

    // ── 1. Get local camera/mic on mount ──────────────────────────────────
    useEffect(() => {
        try {
            const u = JSON.parse(localStorage.getItem('user'));
            if (u?.name || u?.username) setUsername(u.name || u.username);
        } catch (_) {}

        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                localStreamRef.current = stream;
                setDisplayStream(stream);          // ← drive LocalVideoCard via state
                if (lobbyVideoRef.current) lobbyVideoRef.current.srcObject = stream;
            } catch (err) {
                console.error('Media error:', err);
                toast.error('Could not access camera/microphone.');
            }
        })();

        return () => {
            localStreamRef.current?.getTracks().forEach(t => t.stop());
            screenRef.current?.getTracks().forEach(t => t.stop());
            socketRef.current?.disconnect();
            Object.values(connectionsRef.current).forEach(pc => pc.close());
        };
    }, []);

    // ── 2. Auto-scroll chat ───────────────────────────────────────────────
    useEffect(() => {
        if (showChat) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showChat]);

    // ── 3. Toggle local audio/video ───────────────────────────────────────
    const toggleAudio = () => {
        const next = !audioEnabled;
        setAudioEnabled(next);
        localStreamRef.current?.getAudioTracks().forEach(t => (t.enabled = next));
        broadcastState(videoEnabled, next);
    };

    const toggleVideo = () => {
        const next = !videoEnabled;
        setVideoEnabled(next);
        localStreamRef.current?.getVideoTracks().forEach(t => (t.enabled = next));
        broadcastState(next, audioEnabled);
    };

    const broadcastState = (v, a) => {
        Object.keys(connectionsRef.current).forEach(id =>
            socketRef.current?.emit('signal', id, { type: 'control_state', videoEnabled: v, audioEnabled: a })
        );
    };

    // ── 4. WebRTC peer connection helpers ─────────────────────────────────
    const buildPc = (targetId) => {
        const pc = new RTCPeerConnection(ICE_CONFIG);
        connectionsRef.current[targetId] = pc;

        pc.onicecandidate = (e) => {
            if (e.candidate) socketRef.current?.emit('signal', targetId, { candidate: e.candidate });
        };

        pc.ontrack = (e) => {
            const remote = e.streams[0];
            setParticipants(prev => {
                const exists = prev.find(p => p.socketId === targetId);
                if (exists) return prev.map(p => p.socketId === targetId ? { ...p, stream: remote } : p);
                return [...prev, { socketId: targetId, stream: remote, username: '', audioEnabled: true, videoEnabled: true }];
            });
        };

        localStreamRef.current?.getTracks().forEach(t => pc.addTrack(t, localStreamRef.current));
        return pc;
    };

    const initiateConnection = async (targetId) => {
        const pc = buildPc(targetId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('signal', targetId, {
            sdp: pc.localDescription, username,
            videoEnabled: screenSharing || videoEnabled, audioEnabled
        });
    };

    const handleSignal = async (fromId, msg) => {
        // Control state sync
        if (msg.type === 'control_state') {
            setParticipants(prev => prev.map(p =>
                p.socketId === fromId ? { ...p, videoEnabled: msg.videoEnabled, audioEnabled: msg.audioEnabled } : p
            ));
            return;
        }

        // Username sync
        if (msg.username) {
            setParticipants(prev => {
                const exists = prev.find(p => p.socketId === fromId);
                const patch  = { username: msg.username, audioEnabled: msg.audioEnabled ?? true, videoEnabled: msg.videoEnabled ?? true };
                if (exists) return prev.map(p => p.socketId === fromId ? { ...p, ...patch } : p);
                return [...prev, { socketId: fromId, stream: null, ...patch }];
            });
        }

        let pc = connectionsRef.current[fromId];

        // SDP exchange
        if (msg.sdp?.type === 'offer') {
            if (!pc) pc = buildPc(fromId);
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socketRef.current?.emit('signal', fromId, {
                sdp: pc.localDescription, username,
                videoEnabled: screenSharing || videoEnabled, audioEnabled
            });
        } else if (msg.sdp?.type === 'answer' && pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.sdp)).catch(console.error);
        }

        // ICE candidates
        if (msg.candidate && pc) {
            await pc.addIceCandidate(new RTCIceCandidate(msg.candidate)).catch(console.error);
        }
    };

    // ── 5. Connect to meeting room ────────────────────────────────────────
    const joinMeeting = () => {
        if (!username.trim()) { toast.error('Please enter a display name'); return; }
        setIsConnecting(true);

        const socket = io(SERVER_URL, { transports: ['websocket'], reconnectionAttempts: 5, timeout: 10000 });
        socketRef.current = socket;

        ['connect', 'connect_error', 'user_joined', 'user_left', 'signal', 'chat_message']
            .forEach(ev => socket.off(ev));

        socket.on('connect', () => {
            socket.emit('join_call', url);
            setAskForUsername(false);
            setIsConnecting(false);
            toast.success('Joined meeting!');
        });

        socket.on('connect_error', () => {
            setIsConnecting(false);
            toast.error('Failed to connect to signaling server.');
        });

        socket.on('user_joined', (joinedId, all) => {
            if (joinedId === socket.id) {
                all.forEach(id => { if (id !== socket.id) initiateConnection(id); });
            } else {
                socket.emit('signal', joinedId, {
                    type: 'control_state',
                    videoEnabled: screenSharing || videoEnabled,
                    audioEnabled, username
                });
            }
        });

        socket.on('user_left', (leftId) => {
            connectionsRef.current[leftId]?.close();
            delete connectionsRef.current[leftId];
            setParticipants(prev => prev.filter(p => p.socketId !== leftId));
            toast('A participant left', { icon: '👋' });
        });

        socket.on('signal', handleSignal);

        socket.on('chat_message', (data, sender, senderSocketId) => {
            const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setMessages(prev => [...prev, { data, sender, senderSocketId, ts }]);
            setShowChat(cur => {
                if (!cur) {
                    setUnread(u => u + 1);
                    if (!notifMuted && senderSocketId !== socket.id) {
                        toast(`${sender}: ${data}`, {
                            icon: '💬',
                            style: { background: '#111118', color: '#f4f4f5', border: '1px solid #27272a' }
                        });
                        chime();
                    }
                }
                return cur;
            });
        });
    };

    // ── 6. Screen sharing ─────────────────────────────────────────────────
    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
            screenRef.current  = screenStream;
            const screenTrack  = screenStream.getVideoTracks()[0];

            // Replace video track for all peers
            Object.values(connectionsRef.current).forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });

            // ─── KEY FIX: Update displayStream so LocalVideoCard re-renders ───
            setDisplayStream(screenStream);
            setScreenSharing(true);
            broadcastState(true, audioEnabled);

            // Auto-stop when user stops via browser UI
            screenTrack.onended = stopScreenShare;
            toast.success('Screen sharing started');
        } catch (err) {
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
                console.error('Screen share error:', err);
                toast.error('Could not start screen sharing.');
            }
        }
    };

    const stopScreenShare = () => {
        screenRef.current?.getTracks().forEach(t => t.stop());
        screenRef.current = null;

        // Restore camera track for all peers
        const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
        Object.values(connectionsRef.current).forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender && cameraTrack) sender.replaceTrack(cameraTrack);
        });

        // ─── KEY FIX: Revert displayStream back to camera ───
        setDisplayStream(localStreamRef.current);
        setScreenSharing(false);
        broadcastState(videoEnabled, audioEnabled);
        toast.success('Screen sharing stopped');
    };

    const toggleScreenShare = () => (screenSharing ? stopScreenShare() : startScreenShare());

    // ── 7. Chat send ──────────────────────────────────────────────────────
    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !socketRef.current) return;
        socketRef.current.emit('chat_message', chatInput.trim(), username);
        setChatInput('');
    };

    // ── 8. Leave call ─────────────────────────────────────────────────────
    const leaveCall = () => {
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        screenRef.current?.getTracks().forEach(t => t.stop());
        socketRef.current?.disconnect();
        Object.values(connectionsRef.current).forEach(pc => pc.close());
        toast.success('Left the meeting');
        navigate('/');
    };

    // ── 9. Copy link ──────────────────────────────────────────────────────
    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => { setCopied(true); toast.success('Link copied!'); setTimeout(() => setCopied(false), 2000); })
            .catch(() => toast.error('Failed to copy.'));
    };

    // ── 10. Grid sizing ───────────────────────────────────────────────────
    const count = participants.length + 1;
    const sizeClass =
        count === 1 ? 'w-full max-w-4xl aspect-video'
        : count === 2 ? 'w-full md:w-[48%] aspect-video'
        : count <= 4 ? 'w-full sm:w-[48%] aspect-video'
        : 'w-full sm:w-[48%] lg:w-[31%] aspect-video';

    // ════════════════════════════════════════════════════════════════
    //  LOBBY SCREEN
    // ════════════════════════════════════════════════════════════════
    if (askForUsername) {
        return (
            <div className="min-h-screen bg-[#08080f] text-zinc-100 flex flex-col relative overflow-hidden font-sans">
                {/* Ambient glows */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-violet-900/10 blur-[130px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-indigo-900/8 blur-[100px] rounded-full pointer-events-none" />

                {/* Header */}
                <header className="w-full max-w-7xl mx-auto px-6 py-5 flex justify-between items-center z-10 relative">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                            <Video size={15} className="text-white" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-white">Apna Video Call</span>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-xs font-semibold text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                        ← Home
                    </button>
                </header>

                {/* Main */}
                <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-8 z-10 relative">
                    {/* Camera preview */}
                    <div className="w-full lg:w-[58%]">
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-zinc-800 bg-[#0d0d14] shadow-2xl shadow-black/40">
                            <video
                                ref={lobbyVideoRef}
                                autoPlay playsInline muted
                                className={`w-full h-full object-cover -scale-x-100 ${videoEnabled && displayStream ? 'block' : 'hidden'}`}
                            />
                            {(!videoEnabled || !displayStream) && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                    <div className="w-20 h-20 rounded-full bg-zinc-800/60 border border-zinc-700 flex items-center justify-center">
                                        <User className="text-zinc-500" size={36} />
                                    </div>
                                    <span className="text-zinc-600 text-sm font-medium">Camera is off</span>
                                </div>
                            )}

                            {/* Quick toggles overlay */}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10 shadow-xl z-10">
                                <ControlBtn
                                    onClick={() => { const v = !audioEnabled; setAudioEnabled(v); localStreamRef.current?.getAudioTracks().forEach(t => t.enabled = v); }}
                                    danger={!audioEnabled}
                                    title={audioEnabled ? 'Mute' : 'Unmute'}
                                >
                                    {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                                </ControlBtn>
                                <ControlBtn
                                    onClick={() => { const v = !videoEnabled; setVideoEnabled(v); localStreamRef.current?.getVideoTracks().forEach(t => t.enabled = v); }}
                                    danger={!videoEnabled}
                                    title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
                                >
                                    {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                                </ControlBtn>
                            </div>
                        </div>
                    </div>

                    {/* Join card */}
                    <div className="w-full lg:w-[38%] max-w-sm bg-[#111118] border border-zinc-800 rounded-2xl p-7 shadow-2xl shadow-black/40">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold tracking-tight text-white mb-1.5">Ready to join?</h2>
                            <p className="text-sm text-zinc-500">Set up your audio/video, then enter the room.</p>
                        </div>

                        <div className="space-y-4">
                            {/* Display name */}
                            <div>
                                <label className="block text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                                    Your Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter your display name..."
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && joinMeeting()}
                                    className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition text-sm font-medium"
                                />
                            </div>

                            {/* Meeting code */}
                            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
                                <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest mb-1.5">Meeting Code</p>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-mono text-zinc-400 truncate">{url}</span>
                                    <button
                                        onClick={copyLink}
                                        className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-[11px] font-semibold transition cursor-pointer shrink-0"
                                    >
                                        {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
                                    </button>
                                </div>
                            </div>

                            {/* Join button */}
                            <button
                                onClick={joinMeeting}
                                disabled={isConnecting}
                                className="w-full py-3.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-violet-600/25 active:scale-[0.98] transition-all text-sm flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {isConnecting
                                    ? <><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> Connecting...</>
                                    : 'Join Meeting →'
                                }
                            </button>
                        </div>
                    </div>
                </main>

                <footer className="text-center py-5 text-xs text-zinc-800 border-t border-zinc-900/60 z-10 relative">
                    © {new Date().getFullYear()} Apna Video Call
                </footer>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════
    //  CALL SCREEN
    // ════════════════════════════════════════════════════════════════
    return (
        <div className="h-screen bg-[#08080f] text-zinc-100 flex flex-col overflow-hidden font-sans">

            {/* ── Header ────────────────────────────────────────────── */}
            <header className="shrink-0 px-5 py-3 bg-[#0d0d14] border-b border-zinc-800/80 flex items-center justify-between z-20">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow shadow-violet-600/30">
                            <Video size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-bold text-white">Apna Video Call</span>
                    </div>
                    <div className="h-4 w-px bg-zinc-800" />
                    <div className="flex items-center gap-2 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
                        <span className="text-[11px] font-mono text-white max-w-[90px] sm:max-w-[180px] truncate">{url}</span>
                        <button onClick={copyLink} className="text-white hover:text-zinc-200 transition cursor-pointer ml-1">
                            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 px-3 py-1.5 rounded-lg">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <Users size={13} className="text-violet-400" />
                    <span className="text-xs font-bold text-zinc-200">{count}</span>
                    <span className="text-[11px] text-zinc-600 hidden sm:inline">online</span>
                </div>
            </header>

            {/* ── Body ──────────────────────────────────────────────── */}
            <main className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

                {/* Video grid */}
                <div className="flex-1 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
                    <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-6xl">
                        {/* ← displayStream (state) is passed here so LocalVideoCard reacts to screen share */}
                        <LocalVideoCard
                            stream={displayStream}
                            videoEnabled={videoEnabled}
                            audioEnabled={audioEnabled}
                            username={username}
                            screenSharing={screenSharing}
                            sizeClass={sizeClass}
                        />
                        {participants.map(p => (
                            <RemoteVideo key={p.socketId} participant={p} sizeClass={sizeClass} />
                        ))}
                    </div>
                </div>

                {/* Chat panel */}
                {showChat && (
                    <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l border-zinc-800 bg-[#0d0d14] flex flex-col shrink-0 h-[45%] md:h-full z-10">
                        {/* Chat header */}
                        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between shrink-0">
                            <h3 className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                                <MessageSquare size={14} className="text-violet-400" />
                                Meeting Chat
                            </h3>
                            <button
                                onClick={() => { setShowChat(false); setUnread(0); }}
                                className="text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 p-1.5 rounded-lg transition cursor-pointer"
                            >
                                <X size={15} />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-700">
                                    <MessageSquare size={22} className="opacity-40" />
                                    <p className="text-xs">No messages yet</p>
                                </div>
                            ) : (
                                messages.map((msg, i) => {
                                    const isSelf = msg.senderSocketId === socketRef.current?.id;
                                    return (
                                        <div key={i} className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-[10px] font-bold text-zinc-500">{msg.sender}</span>
                                                <span className="text-[9px] text-zinc-700">{msg.ts}</span>
                                            </div>
                                            <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] break-words leading-relaxed font-medium ${
                                                isSelf
                                                    ? 'bg-violet-600 text-white rounded-tr-sm'
                                                    : 'bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700/50'
                                            }`}>
                                                {msg.data}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat input */}
                        <form onSubmit={sendChat} className="p-3 border-t border-zinc-800 shrink-0">
                            <div className="relative flex items-center">
                                <input
                                    type="text"
                                    placeholder="Send a message..."
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    className="w-full pl-4 pr-12 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-1.5 p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition cursor-pointer active:scale-95"
                                >
                                    <Send size={13} />
                                </button>
                            </div>
                        </form>
                    </aside>
                )}
            </main>

            {/* ── Controls footer ────────────────────────────────────── */}
            <footer className="shrink-0 px-6 py-4 bg-[#0d0d14] border-t border-zinc-800/80 flex items-center justify-between gap-4 z-20">
                {/* Left: user info */}
                <div className="hidden sm:flex items-center gap-2.5 min-w-0 w-36">
                    <div className="w-7 h-7 rounded-full bg-violet-900/40 border border-violet-700/20 flex items-center justify-center shrink-0">
                        <User size={13} className="text-violet-300" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-400 truncate">{username}</span>
                </div>

                {/* Center: control buttons */}
                <div className="flex items-center gap-2 mx-auto">
                    <ControlBtn onClick={toggleAudio} danger={!audioEnabled} title={audioEnabled ? 'Mute mic' : 'Unmute mic'}>
                        {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                    </ControlBtn>

                    <ControlBtn onClick={toggleVideo} danger={!videoEnabled} title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}>
                        {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                    </ControlBtn>

                    <ControlBtn
                        onClick={toggleScreenShare}
                        active={screenSharing}
                        title={screenSharing ? 'Stop sharing' : 'Share screen'}
                    >
                        {screenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
                    </ControlBtn>

                    <ControlBtn
                        onClick={() => { setShowChat(!showChat); setUnread(0); }}
                        active={showChat}
                        title="Toggle chat"
                        className="relative"
                    >
                        <MessageSquare size={18} />
                        {unread > 0 && !showChat && (
                            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#0d0d14] animate-bounce">
                                {unread > 9 ? '9+' : unread}
                            </span>
                        )}
                    </ControlBtn>

                    <ControlBtn
                        onClick={() => {
                            const next = !notifMuted;
                            setNotifMuted(next);
                            toast(next ? 'Notifications muted' : 'Notifications on', { icon: next ? '🔕' : '🔔' });
                        }}
                        danger={notifMuted}
                        title={notifMuted ? 'Unmute notifications' : 'Mute notifications'}
                    >
                        {notifMuted ? <BellOff size={18} /> : <Bell size={18} />}
                    </ControlBtn>

                    {/* Separator */}
                    <div className="w-px h-8 bg-zinc-800 mx-1" />

                    {/* Leave button */}
                    <button
                        onClick={leaveCall}
                        title="Leave meeting"
                        className="flex items-center gap-2 px-5 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-600/20 transition-all duration-200 text-xs cursor-pointer active:scale-[0.97] border border-red-500/30"
                    >
                        <PhoneOff size={16} />
                        <span className="hidden sm:inline">Leave</span>
                    </button>
                </div>

                {/* Right: version tag */}
                <div className="hidden sm:flex items-center justify-end w-36">
                    <span className="text-[10px] text-zinc-800 font-mono font-semibold tracking-wider">v1.0</span>
                </div>
            </footer>
        </div>
    );
};

export default VideoMeet;