import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Mic, VideoOff, MicOff, Settings, Sparkles } from "lucide-react";
import { socket } from "../socket";
import { cn } from "../components/video/IconButton";

export default function Join() {
  const [name, setName] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function getMedia() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
      }
    }
    getMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name) return;

    socket.emit("join", { name, callType: isVideoOff ? "audio" : "video" });
    navigate("/users");
  };

  const toggleMic = () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-50 overflow-hidden relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10"
      >
        {/* Left Side: Preview */}
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Ready to join?</h1>
            <p className="text-slate-400">Check your audio and video before entering the lobby.</p>
          </div>

          <div className="relative aspect-video rounded-[2.5rem] bg-slate-900 overflow-hidden border border-white/10 shadow-2xl group">
            <AnimatePresence mode="wait">
              {isVideoOff ? (
                <motion.div
                  key="off"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800"
                >
                  <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4">
                    <VideoOff className="w-10 h-10 text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-medium">Camera is off</p>
                </motion.div>
              ) : (
                <motion.video
                  key="on"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover mirror"
                />
              )}
            </AnimatePresence>

            {/* Preview Controls */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={toggleMic}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isMuted ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              <button
                onClick={toggleVideo}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isVideoOff ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white hover:bg-white/20"
                )}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <button className="p-2.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all">
                <Settings className="w-5 h-5" />
              </button>
            </div>

            {/* Indicator */}
            <div className="absolute top-6 left-6 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Live Preview</span>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex flex-col gap-8 bg-slate-900/50 backdrop-blur-md p-10 rounded-[3rem] border border-white/10 shadow-2xl">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Modern Experience
            </div>
            <h2 className="text-3xl font-bold">Your information</h2>
          </div>

          <form onSubmit={handleJoin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-400 ml-1">Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field py-4 text-lg"
                placeholder="Enter your name"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!name}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
            >
              Join the Lobby
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm">
            By joining, you agree to our terms of service.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
