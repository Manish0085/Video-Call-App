import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket.js";

export default function Call() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pc = useRef(null);
  const streamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCalling, setIsCalling] = useState(true);

  const handleExit = () => {
    stopMedia();
    socket.emit("end-call", { targetId: id });
    navigate("/users");
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.enabled = false;
        track.stop();
      });
      streamRef.current = null;
    }
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  };

  useEffect(() => {
    let mounted = true;

    socket.emit("get-users");
    const handleInitialCheck = (usersArray) => {
      const target = usersArray.find(([uid]) => uid === id);
      if (target && target[1].status === "on-call" && target[1].partnerId !== socket.id) {
        alert("This user is currently on another call.");
        navigate("/users");
      }
    };
    socket.on("users-update", handleInitialCheck);

    const handleUnload = () => {
      stopMedia();
      socket.emit("end-call", { targetId: id });
    };
    window.addEventListener("beforeunload", handleUnload);

    pc.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject"
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject"
        }
      ],
    });

    pc.current.ontrack = (e) => {
      if (remoteRef.current && mounted) {
        remoteRef.current.srcObject = e.streams[0];
        setIsCalling(false);
      }
    };

    pc.current.onicecandidate = (e) => {
      if (e.candidate && mounted) {
        socket.emit("ice-candidate", {
          targetId: id,
          candidate: e.candidate,
        });
      }
    };

    const socketOfferHandler = async ({ from, offer }) => {
      if (from !== id || !mounted) return;
      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit("answer", { targetId: from, answer });
    };

    const socketAnswerHandler = async ({ answer }) => {
      if (!mounted) return;
      if (pc.current.signalingState !== "have-local-offer") return;
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const socketIceHandler = async ({ candidate }) => {
      if (!mounted) return;
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) { }
    };

    socket.on("offer", socketOfferHandler);
    socket.on("answer", socketAnswerHandler);
    socket.on("ice-candidate", socketIceHandler);
    socket.on("call-ended", () => {
      if (mounted) handleExit();
    });

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (localRef.current) localRef.current.srcObject = stream;
        stream.getTracks().forEach((t) => pc.current.addTrack(t, stream));
        if (socket.id < id) startCall();
      })
      .catch(err => {
        console.error("Media error:", err);
        if (mounted) navigate("/users");
      });

    async function startCall() {
      if (!mounted) return;
      const offer = await pc.current.createOffer();
      await pc.current.setLocalDescription(offer);
      socket.emit("offer", { targetId: id, offer });
    }

    return () => {
      mounted = false;
      socket.off("offer", socketOfferHandler);
      socket.off("answer", socketAnswerHandler);
      socket.off("ice-candidate", socketIceHandler);
      socket.off("call-ended");
      socket.off("users-update", handleInitialCheck);
      window.removeEventListener("beforeunload", handleUnload);
      stopMedia();
      if (pc.current) pc.current.close();
    };
  }, [id]);

  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white">
      {/* Background Ambience */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/30 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full h-full relative z-10">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover transition-opacity duration-1000 ${isCalling ? 'opacity-0' : 'opacity-100'}`}
        />

        {isCalling && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-md">
            <div className="w-24 h-24 rounded-[2rem] border-4 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <p className="mt-10 text-2xl font-black tracking-tight animate-pulse text-indigo-400">
              Securing Connection...
            </p>
          </div>
        )}

        {/* Local Preview - Pinned Top Right */}
        <div className="absolute top-8 right-8 w-56 h-36 md:w-72 md:h-48 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl glass transition-all hover:scale-105 group">
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover mirror ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-4xl">
              👤
            </div>
          )}
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/40 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">
            You {isMuted && '• Muted'}
          </div>
        </div>

        {/* Control Bar - Centered Bottom */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 px-10 py-5 glass-dark rounded-[2.5rem] border border-white/10 shadow-2xl">
          <button
            onClick={toggleMic}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'}`}
          >
            {isMuted ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            )}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'}`}
          >
            {isVideoOff ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 3l18 18" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            )}
          </button>

          <div className="w-[1px] h-10 bg-white/10 mx-2"></div>

          <button
            onClick={handleExit}
            className="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-[1.5rem] shadow-2xl shadow-red-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 rotate-[135deg]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
