import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Home,
  Users as UsersIcon,
  LogOut,
  Video,
  MessageCircle,
  X,
  PhoneOff,
  Bell,
  Search,
  MoreVertical,
  Activity
} from "lucide-react";
import IconButton from "../components/video/IconButton";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [messages, setMessages] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const navigate = useNavigate();
  const { authUser, logout } = useAuth();

  const chatEndRef = useRef(null);

  useEffect(() => {
    if (authUser) {
      socket.emit("join", { user: authUser });
    }
  }, [authUser]);

  useEffect(() => {
    socket.on("users-update", setUsers);
    socket.emit("get-users");

    socket.on("incoming-call", ({ from, fromName }) => {
      setIncomingCall({ from, fromName });
    });

    socket.on("room-created", ({ roomId }) => {
      navigate(`/group/${roomId}`);
    });

    socket.on("call-initiated", ({ targetId }) => {
      setOutgoingCall(targetId);
    });

    socket.on("call-accepted", () => {
      if (outgoingCall) navigate(`/call/${outgoingCall}`);
    });

    socket.on("call-rejected", ({ reason }) => {
      if (reason === "busy") alert("User is busy.");
      else if (reason === "declined") alert("User declined.");
      setOutgoingCall(null);
    });

    socket.on("receive-message", ({ from, message, timestamp }) => {
      setMessages(prev => ({
        ...prev,
        [from]: [...(prev[from] || []), { text: message, fromMe: false, time: timestamp }]
      }));
    });

    return () => {
      socket.off("users-update");
      socket.off("incoming-call");
      socket.off("room-created");
      socket.off("call-initiated");
      socket.off("call-accepted");
      socket.off("call-rejected");
      socket.off("receive-message");
    };
  }, [navigate, outgoingCall]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    socket.emit("send-message", { targetId: activeChat, message: chatInput });
    setMessages(prev => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), { text: chatInput, fromMe: true, time: new Date().toISOString() }]
    }));
    setChatInput("");
  };

  const activeUser = users.find(([id]) => id === activeChat)?.[1];

  const handleAccept = () => {
    socket.emit("accept-call", { targetId: incomingCall.from });
    navigate(`/call/${incomingCall.from}`);
    setIncomingCall(null);
  };

  const handleDecline = () => {
    socket.emit("reject-call", { targetId: incomingCall.from });
    setIncomingCall(null);
  };

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden font-sans text-slate-50 bg-noise relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-80 glass-dark flex-col z-20 border-r border-white/5">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Lumina</h1>
          </div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 rounded-3xl bg-slate-900/50 border border-white/5 relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-800 ring-2 ring-white/10 group-hover:ring-indigo-500/50 transition-all">
                {authUser?.profilePic ? (
                  <img src={authUser.profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-slate-700 to-slate-800">
                    {authUser?.fullName[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-sm truncate max-w-[120px]">{authUser?.fullName}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Online</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-4 p-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 font-bold text-sm transition-all hover:bg-indigo-600/20">
            <Home className="w-5 h-5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              const roomName = prompt("Enter Group Name:");
              if (roomName) socket.emit("create-room", { roomName });
            }}
            className="w-full flex items-center gap-4 p-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all font-bold text-sm"
          >
            <UsersIcon className="w-5 h-5" />
            <span>Groups</span>
          </button>
        </nav>

        <div className="p-8">
          <button
            onClick={logout}
            className="w-full py-4 bg-slate-900/50 hover:bg-white/5 text-slate-400 hover:text-red-400 rounded-2xl font-bold text-xs uppercase tracking-widest border border-white/5 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10 px-6 py-4 flex items-center justify-around pb-6">
        <button className="flex flex-col items-center gap-1 text-indigo-400">
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Home</span>
        </button>
        <button
          onClick={() => {
            const roomName = prompt("Enter Group Name:");
            if (roomName) socket.emit("create-room", { roomName });
          }}
          className="flex flex-col items-center gap-1 text-slate-400 active:text-white"
        >
          <div className="relative">
            <UsersIcon className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full border-2 border-slate-900"></div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wide">Groups</span>
        </button>
        <button
          onClick={logout}
          className="flex flex-col items-center gap-1 text-slate-400 active:text-red-400"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-wide">Exit</span>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 p-4 sm:p-8 lg:p-12 pb-24 lg:pb-12">
        <header className="max-w-7xl mx-auto mb-12 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div className="w-full sm:w-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">Command Center</h2>
            <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>{users.length - 1} active peers in orbit</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search peers..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <button className="p-3 bg-slate-900/50 border border-white/10 rounded-2xl hover:bg-white/5 hover:text-white text-slate-400 transition-all shrink-0">
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {!socket.connected ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6"></div>
              <p className="text-indigo-400 font-bold tracking-widest uppercase text-xs">Establishing Secure Connection...</p>
            </div>
          ) : users.length <= 1 ? (
            <div className="col-span-full py-32 rounded-[3rem] border border-white/5 bg-slate-900/30 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <UsersIcon className="w-10 h-10 text-slate-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-300">Space is empty</h3>
              <p className="text-slate-500 mt-2 max-w-md mx-auto">It's quiet in here. Wait for other team members to join or invite them to the platform.</p>
            </div>
          ) : (
            users.map(([id, user]) =>
              id !== socket.id && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={id}
                  className="relative group p-6 rounded-[2rem] bg-slate-900/60 border border-white/5 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 ring-4 ring-slate-900 group-hover:scale-105 transition-transform duration-500">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xl bg-gradient-to-tr from-slate-700 to-slate-600">
                            {user.fullName[0]}
                          </div>
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-slate-900 ${user.status === 'idle' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40' : 'bg-amber-500 shadow-lg shadow-amber-500/40'}`}></div>
                    </div>
                    {messages[id]?.length > 0 && !messages[id][messages[id].length - 1].fromMe ? (
                      <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold rounded-full animate-bounce shadow-lg shadow-indigo-600/30">
                        NEW MESSAGE
                      </div>
                    ) : (
                      <button className="p-2 -mr-2 -mt-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">{user.fullName}</h4>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                      {user.status === 'idle' ? 'Available' : 'Currently Busy'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => socket.emit("call-user", { targetId: id })}
                      disabled={user.status !== "idle"}
                      className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                    >
                      <Video className="w-4 h-4" />
                      <span>Call</span>
                    </button>
                    <button
                      onClick={() => setActiveChat(id)}
                      className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-white/5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Chat</span>
                    </button>
                  </div>
                </motion.div>
              )
            )
          )}
        </div>
      </main>

      {/* Modern Chat Drawer */}
      <AnimatePresence>
        {activeChat && activeUser && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 right-0 w-full sm:w-[480px] glass-dark shadow-2xl z-[60] border-l border-white/10 flex flex-col"
          >
            <div className="p-6 border-b border-white/5 bg-slate-900/50 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800">
                  {activeUser.profilePic ? (
                    <img src={activeUser.profilePic} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-lg bg-slate-700">
                      {activeUser.fullName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{activeUser.fullName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Secure Chat</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveChat(null)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(messages[activeChat] || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-5 py-3 rounded-2xl text-sm leading-relaxed ${msg.fromMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'}`}>
                    {msg.text}
                    <div className={`text-[10px] mt-1 font-medium ${msg.fromMe ? 'text-indigo-200' : 'text-slate-500'} text-right`}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-6 bg-slate-900/50 border-t border-white/5 backdrop-blur-md">
              <div className="relative flex items-center gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full pl-6 pr-14 py-4 bg-slate-800/50 border border-white/5 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-800 outline-none transition-all placeholder:text-slate-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                  </svg>
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Incoming Call Alert - Premium */}
      <AnimatePresence>
        {incomingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center z-50 p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 rounded-[3rem] p-12 max-w-sm w-full shadow-2xl text-center border border-white/10 relative overflow-hidden"
            >
              {/* Ping Animation */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[80px] animate-pulse"></div>

              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-full h-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white rounded-full flex items-center justify-center text-4xl font-bold shadow-2xl ring-4 ring-slate-800">
                  {incomingCall.fromName[0]}
                </div>
              </div>

              <h3 className="text-3xl font-bold text-white leading-tight">Incoming Call</h3>
              <p className="text-slate-400 mt-2 font-medium mb-10">{incomingCall.fromName} is requesting a secure line</p>

              <div className="flex gap-4 relative z-10">
                <button
                  onClick={handleDecline}
                  className="flex-1 py-4 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-2xl font-bold transition-all border border-white/5"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outgoing Call Overlay */}
      <AnimatePresence>
        {outgoingCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-50"
          >
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-8">
                <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-r-4 border-indigo-500/30 rounded-full animate-spin animation-delay-200"></div>
                <div className="absolute inset-4 border-b-4 border-indigo-500/10 rounded-full animate-spin animation-delay-500"></div>
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">Establishing Connection</h3>
              <p className="text-slate-500 mt-2">Waiting for response...</p>

              <button
                onClick={() => { socket.emit("reject-call", { targetId: outgoingCall }); setOutgoingCall(null); }}
                className="mt-12 w-16 h-16 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/50 flex items-center justify-center transition-all mx-auto"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
