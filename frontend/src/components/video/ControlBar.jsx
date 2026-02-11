import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    MonitorUp,
    Users,
    MessageSquare,
    MoreVertical,
    X
} from "lucide-react";
import IconButton from "./IconButton";

export default function ControlBar({
    isMuted,
    onToggleMic,
    isVideoOff,
    onToggleVideo,
    onEndCall,
    isSharing,
    onToggleShare,
    onToggleParticipants,
    onToggleChat
}) {
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-0 left-0 right-0 flex justify-center pb-8 pt-4 px-4 z-50 pointer-events-none"
        >
            <div className="relative flex items-center gap-3 px-6 py-4 bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto">
                {/* Mobile Menu Popup */}
                <AnimatePresence>
                    {showMobileMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            className="absolute bottom-full mb-4 left-0 right-0 bg-slate-900/95 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl flex flex-col gap-2 sm:hidden"
                        >
                            <button
                                onClick={() => { onToggleShare(); setShowMobileMenu(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all font-medium"
                            >
                                <MonitorUp className="w-5 h-5" />
                                <span>{isSharing ? "Stop Sharing" : "Share Screen"}</span>
                            </button>
                            <button
                                onClick={() => { onToggleParticipants(); setShowMobileMenu(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-white transition-all font-medium"
                            >
                                <Users className="w-5 h-5" />
                                <span>Participants</span>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <IconButton
                    icon={isMuted ? MicOff : Mic}
                    onClick={onToggleMic}
                    active={!isMuted}
                    className={isMuted ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : ""}
                    label={isMuted ? "Unmute" : "Mute"}
                />

                <IconButton
                    icon={isVideoOff ? VideoOff : Video}
                    onClick={onToggleVideo}
                    active={!isVideoOff}
                    className={isVideoOff ? "bg-red-500/20 text-red-500 hover:bg-red-500/30" : ""}
                    label={isVideoOff ? "Start Camera" : "Stop Camera"}
                />

                <div className="w-[1px] h-8 bg-white/10 mx-1 hidden sm:block" />

                <IconButton
                    icon={MonitorUp}
                    onClick={onToggleShare}
                    active={isSharing}
                    className="hidden sm:flex"
                    label="Share Screen"
                />

                <IconButton
                    icon={Users}
                    onClick={onToggleParticipants}
                    className="hidden sm:flex"
                    label="Participants"
                />

                <IconButton
                    icon={MessageSquare}
                    onClick={onToggleChat}
                    className="relative"
                    label="Chat"
                />

                <IconButton
                    icon={showMobileMenu ? X : MoreVertical}
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className={`sm:hidden ${showMobileMenu ? "bg-indigo-600 text-white" : ""}`}
                    label="More options"
                />

                <div className="w-[1px] h-8 bg-white/10 mx-1" />

                <IconButton
                    icon={PhoneOff}
                    onClick={onEndCall}
                    danger
                    className="h-14 w-14 rounded-3xl"
                    label="End Call"
                />
            </div>
        </motion.div>
    );
}
