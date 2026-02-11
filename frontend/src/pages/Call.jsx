import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { socket } from "../socket.js";
import VideoTile from "../components/video/VideoTile";
import ControlBar from "../components/video/ControlBar";

export default function Call() {
  const { id } = useParams();
  const navigate = useNavigate();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const pc = useRef(null);
  const streamRef = useRef(null);
  const remoteStreamRef = useRef(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isCalling, setIsCalling] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);

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
        }
      ],
    });

    pc.current.ontrack = (e) => {
      if (mounted) {
        setRemoteStream(e.streams[0]);
        remoteStreamRef.current = e.streams[0];
        setIsCalling(false);
        setIsConnected(true);
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
    <div className="h-screen bg-slate-950 flex flex-col text-white overflow-hidden relative">
      {/* Status Bar */}
      <div className="absolute top-6 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 px-4 py-2 glass-dark rounded-2xl pointer-events-auto">
          {isConnected ? (
            <Wifi className="h-4 w-4 text-emerald-400" />
          ) : (
            <WifiOff className="h-4 w-4 text-red-400 animate-pulse" />
          )}
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            {isConnected ? "Connected" : "Reconnecting..."}
          </span>
        </div>

        <div className="px-4 py-2 glass-dark rounded-2xl pointer-events-auto flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            Live
          </span>
        </div>
      </div>

      {/* Main Video Arena */}
      <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8">
        <AnimatePresence>
          {isCalling ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8 text-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[60px] rounded-full animate-pulse" />
                <Loader2 className="h-24 w-24 text-indigo-500 animate-spin relative z-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Calling...</h2>
                <p className="text-slate-400">Waiting for {id} to join the secure session</p>
              </div>
            </motion.div>
          ) : (
            <div className="w-full h-full max-w-7xl relative mx-auto flex items-center justify-center">
              {/* Remote Video (Primary) */}
              <VideoTile
                stream={remoteStream}
                name={`User ${id.substring(0, 4)}`}
                className="w-full h-full object-contain max-h-[80vh] sm:max-h-full"
              />

              {/* Local Video (PiP) */}
              <motion.div
                drag
                dragConstraints={{ left: -100, right: 100, top: -100, bottom: 100 }}
                className="absolute bottom-24 right-4 w-32 h-24 sm:w-72 sm:h-48 z-10 cursor-move sm:bottom-8 sm:right-8"
              >
                <VideoTile
                  isLocal
                  stream={streamRef.current}
                  name="You"
                  isMuted={isMuted}
                  isVideoOff={isVideoOff}
                  className="ring-2 ring-white/20 shadow-2xl"
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Overlay */}
      <ControlBar
        isMuted={isMuted}
        onToggleMic={toggleMic}
        isVideoOff={isVideoOff}
        onToggleVideo={toggleVideo}
        onEndCall={handleExit}
        isSharing={isSharing}
        onToggleShare={() => setIsSharing(!isSharing)}
        onToggleParticipants={() => { }}
        onToggleChat={() => { }}
      />
    </div>
  );
}
