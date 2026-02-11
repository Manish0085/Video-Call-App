import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MicOff, User } from "lucide-react";
import { cn } from "./IconButton";

export default function VideoTile({
    stream,
    name,
    isLocal = false,
    isMuted = false,
    isVideoOff = false,
    isSpeaking = false,
    className = ""
}) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "relative aspect-video w-full overflow-hidden rounded-3xl bg-slate-900 shadow-xl ring-1 ring-white/10 transition-all",
                isSpeaking && "ring-2 ring-indigo-500 shadow-indigo-500/20 shadow-2xl",
                className
            )}
        >
            <AnimatePresence mode="wait">
                {isVideoOff ? (
                    <motion.div
                        key="avatar"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex h-full w-full items-center justify-center bg-slate-800"
                    >
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-700 md:h-24 md:w-24">
                            <User className="h-10 w-10 text-slate-400 md:h-12 md:w-12" />
                        </div>
                    </motion.div>
                ) : (
                    <motion.video
                        key="video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isLocal}
                        className={cn(
                            "h-full w-full object-cover",
                            isLocal && "scale-x-[-1]"
                        )}
                    />
                )}
            </AnimatePresence>

            {/* Overlay Details */}
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-black/40 px-3 py-1.5 backdrop-blur-md ring-1 ring-white/10">
                <span className="text-xs font-semibold text-white tracking-wide">
                    {name} {isLocal && "(You)"}
                </span>
                {isMuted && (
                    <MicOff className="h-3.5 w-3.5 text-red-500" />
                )}
            </div>

            {/* Mic Activity Glow */}
            {isSpeaking && (
                <div className="absolute inset-0 pointer-events-none rounded-3xl ring-4 ring-indigo-500/30 animate-pulse" />
            )}
        </motion.div>
    );
}
