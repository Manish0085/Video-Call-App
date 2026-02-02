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
        console.log(`Explicitly stopped ${track.kind} track`);
      });
      streamRef.current = null;
    }
    if (localRef.current) localRef.current.srcObject = null;
    if (remoteRef.current) remoteRef.current.srcObject = null;
  };

  useEffect(() => {
    let mounted = true;

    // Guard: Check if target is actually available/partnered
    socket.emit("get-users");
    const handleInitialCheck = (usersArray) => {
      const target = usersArray.find(([uid]) => uid === id);
      const me = usersArray.find(([uid]) => uid === socket.id);

      // If target is already on call with someone else, kick me out
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
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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
      // Handle glare: if we're both offering, smaller ID backs off
      if (pc.current.signalingState !== "stable" && pc.current.signalingState !== "have-local-offer") {
        console.log("Offer received in non-idle state:", pc.current.signalingState);
      }

      await pc.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      socket.emit("answer", { targetId: from, answer });
    };

    const socketAnswerHandler = async ({ answer }) => {
      if (!mounted) return;
      if (pc.current.signalingState !== "have-local-offer") {
        console.warn("Received answer while not in have-local-offer state:", pc.current.signalingState);
        return;
      }
      await pc.current.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const socketIceHandler = async ({ candidate }) => {
      if (!mounted) return;
      try {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        // Ignore candidates if remote description isn't set yet
      }
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
        if (localRef.current) {
          localRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((t) => pc.current.addTrack(t, stream));
        // Deterministic start: only one peer initiates to avoid glare
        // Check if I am the initiator based on Socket ID comparison
        if (socket.id < id) {
          console.log("Initiating P2P call...");
          startCall();
        } else {
          console.log("Waiting for peer to initiate...");
        }
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
      if (pc.current) {
        pc.current.close();
        pc.current = null;
      }
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
    <div className="h-screen bg-neutral-950 flex flex-col items-center justify-center relative overflow-hidden text-white">
      <div className="w-full h-full relative group">
        <video
          ref={remoteRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {isCalling && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                📞
              </div>
            </div>
            <p className="mt-6 text-xl font-medium animate-pulse text-blue-400">
              Connecting to peer...
            </p>
          </div>
        )}

        <div className="absolute top-6 right-6 w-48 h-32 md:w-64 md:h-44 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl transition-transform hover:scale-105">
          <video
            ref={localRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-4xl">
              👤
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-white/10">
            You {isMuted && '• Muted'}
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-neutral-900/60 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl transition-all hover:bg-neutral-900/80">
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
          >
            {isMuted ? '🎙️' : '🎤'}
          </button>

          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-neutral-800 text-gray-300 hover:bg-neutral-700'
              }`}
          >
            {isVideoOff ? '📵' : '🎥'}
          </button>

          <div className="w-[1px] h-8 bg-white/10 mx-2"></div>

          <button
            onClick={handleExit}
            className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl shadow-lg shadow-red-900/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
          >
            <span className="text-2xl rotate-[135deg]">📞</span>
          </button>
        </div>
      </div>
    </div>
  );
}
