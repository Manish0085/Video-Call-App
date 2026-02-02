import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function GroupCall() {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [peers, setPeers] = useState({}); // { socketId: { stream } }
    const [localStream, setLocalStream] = useState(null);
    const localVideoRef = useRef();

    const pcs = useRef({});
    const streamRef = useRef(null);

    useEffect(() => {
        let mounted = true;

        async function init() {
            try {
                console.log("Group: Requesting media...");
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                streamRef.current = stream;
                setLocalStream(stream);
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;

                console.log("Group: Joining room:", roomId);
                socket.emit("join-room", { roomId });
            } catch (err) {
                console.error("Group: Media error:", err);
                alert("Camera access denied");
                navigate("/users");
            }
        }

        init();

        // DETERMINISTIC MESH HANDSHAKE (Lexicographical ID comparison)
        // Ensures exactly one offer per pair of users.

        socket.on("room-joined", ({ participants }) => {
            console.log("Group: Already in room:", participants);
            participants.forEach(targetId => {
                // Only initiate if my ID is "smaller" than yours
                if (socket.id < targetId) {
                    initiateConnection(targetId);
                }
            });
        });

        socket.on("user-joined-room", ({ from }) => {
            console.log("Group: Peer joined:", from);
            // Only initiate if my ID is "smaller" than yours
            if (socket.id < from) {
                initiateConnection(from);
            }
        });

        async function initiateConnection(targetId) {
            console.log("Group: I am initiator for:", targetId);
            const pc = createPeerConnection(targetId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", { targetId, offer, fromRoom: roomId });
        }

        socket.on("offer", async ({ from, offer, fromRoom }) => {
            if (fromRoom !== roomId) return;
            console.log("Group: Received offer from:", from);
            const pc = createPeerConnection(from);
            try {
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit("answer", { targetId: from, answer, fromRoom: roomId });
            } catch (e) {
                console.error("Error setting remote offer:", e);
            }
        });

        socket.on("answer", async ({ from, answer, fromRoom }) => {
            if (fromRoom !== roomId) return;
            console.log("Group: Received answer from:", from);
            const pc = pcs.current[from];
            if (pc && pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on("ice-candidate", async ({ from, candidate, fromRoom }) => {
            if (fromRoom !== roomId) return;
            const pc = pcs.current[from];
            if (pc) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (e) { }
            }
        });

        socket.on("user-left-room", ({ from }) => {
            removePeer(from);
        });

        function createPeerConnection(targetId) {
            if (pcs.current[targetId]) return pcs.current[targetId];

            console.log("Group: Creating PeerConnection for:", targetId);
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });

            pcs.current[targetId] = pc;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, streamRef.current);
                });
            }

            pc.onicecandidate = (e) => {
                if (e.candidate) {
                    socket.emit("ice-candidate", { targetId, candidate: e.candidate, fromRoom: roomId });
                }
            };

            pc.ontrack = (e) => {
                console.log("Group: Got track from peer:", targetId);
                setPeers(prev => ({
                    ...prev,
                    [targetId]: { stream: e.streams[0] }
                }));
            };

            pc.onconnectionstatechange = () => {
                console.log(`Group: PC Status with ${targetId}: ${pc.connectionState}`);
                if (pc.connectionState === "failed") removePeer(targetId);
            };

            return pc;
        }

        function removePeer(targetId) {
            if (pcs.current[targetId]) {
                pcs.current[targetId].close();
                delete pcs.current[targetId];
            }
            setPeers(prev => {
                const next = { ...prev };
                delete next[targetId];
                return next;
            });
        }

        return () => {
            mounted = false;
            socket.emit("leave-room", { roomId });
            socket.off("room-joined");
            socket.off("user-joined-room");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice-candidate");
            socket.off("user-left-room");

            Object.values(pcs.current).forEach(pc => pc.close());
            streamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, [roomId, navigate]);

    return (
        <div className="h-screen bg-neutral-950 p-6 flex flex-col text-white">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold">Group Call Center</h2>
                    <p className="text-neutral-500 text-sm">Room: <span className="text-blue-400 font-mono">{roomId}</span></p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => { navigator.clipboard.writeText(roomId); alert("ID Copied"); }}
                        className="bg-neutral-800 px-4 py-2 rounded-xl text-sm hover:bg-neutral-700 transition-all"
                    >
                        Copy ID
                    </button>
                    <button
                        onClick={() => navigate("/users")}
                        className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl font-bold transition-all shadow-lg"
                    >
                        Leave
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                <div className="relative bg-neutral-900 rounded-3xl overflow-hidden border-2 border-blue-500/30">
                    <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
                    <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-white/70 italic">You (Host)</div>
                </div>

                {Object.entries(peers).map(([id, peer]) => (
                    <div key={id} className="relative bg-neutral-900 rounded-3xl overflow-hidden border border-white/5 shadow-xl">
                        <VideoElement stream={peer.stream} />
                        <div className="absolute bottom-4 left-4 bg-black/40 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest text-white/70 italic">Participant</div>
                    </div>
                ))}

                {Object.keys(peers).length === 0 && (
                    <div className="col-span-full py-20 text-center flex flex-col items-center justify-center opacity-30">
                        <div className="text-6xl mb-4">🏠</div>
                        <p className="text-xl font-semibold italic">Sharing is caring. Send your room ID to others.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function VideoElement({ stream }) {
    const ref = useRef();
    useEffect(() => {
        if (ref.current) ref.current.srcObject = stream;
    }, [stream]);
    return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />;
}
