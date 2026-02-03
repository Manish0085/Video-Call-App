import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

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
    <div className="min-h-screen bg-[#FDFDFF] flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-80 glass-dark text-white flex flex-col z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20">
              💎
            </div>
            <h1 className="text-2xl font-black tracking-tighter">Lumina</h1>
          </div>

          <div className="space-y-1">
            <Link to="/profile" className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all group">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-500/30 group-hover:border-indigo-500 transition-all">
                {authUser?.profilePic ? (
                  <img src={authUser.profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <div className="w-full h-full bg-indigo-600 flex items-center justify-center font-bold">
                    {authUser?.fullName[0]}
                  </div>
                )}
              </div>
              <div>
                <p className="font-bold text-sm truncate max-w-[120px]">{authUser?.fullName}</p>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">Premium User</p>
              </div>
            </Link>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button className="w-full flex items-center gap-4 p-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <span className="text-xl">🏠</span>
            <span className="font-bold text-sm">Dashboard</span>
          </button>
          <button
            onClick={() => {
              const roomName = prompt("Enter Group Name:");
              if (roomName) socket.emit("create-room", { roomName });
            }}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 text-slate-400 rounded-2xl transition-all"
          >
            <span className="text-xl">👥</span>
            <span className="font-bold text-sm">Groups</span>
          </button>
        </nav>

        <div className="p-8">
          <button
            onClick={logout}
            className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm border border-white/5 transition-all"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10 relative">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Active Peers</h2>
              <p className="text-slate-500 font-medium mt-2">Connect with {users.length - 1} people online</p>
            </div>

            <button
              onClick={() => {
                const roomId = prompt("Enter Room ID:");
                if (roomId) navigate(`/group/${roomId}`);
              }}
              className="btn-secondary flex items-center gap-2"
            >
              <span>🔑</span> Join Private Room
            </button>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!socket.connected ? (
              <div className="col-span-full py-20 text-center animate-pulse text-indigo-500 font-bold">
                Handshaking with server...
              </div>
            ) : users.length <= 1 ? (
              <div className="col-span-full py-32 glass rounded-[3rem] text-center border-dashed border-2 border-slate-200">
                <div className="text-6xl mb-6">🏜️</div>
                <h3 className="text-2xl font-black text-slate-900">It's quiet here</h3>
                <p className="text-slate-500 mt-2 font-medium">Wait for others to join the network</p>
              </div>
            ) : (
              users.map(([id, user]) =>
                id !== socket.id && (
                  <div key={id} className="card group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300">
                    <div className="flex justify-between items-start mb-8">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-[1.8rem] overflow-hidden border-4 border-white shadow-xl group-hover:scale-110 transition-all duration-500">
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-bold">
                              {user.fullName[0]}
                            </div>
                          )}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${user.status === 'idle' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                      </div>

                      {messages[id]?.length > 0 && !messages[id][messages[id].length - 1].fromMe && (
                        <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-indigo-600/20 animate-bounce">
                          NEW
                        </div>
                      )}
                    </div>

                    <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">{user.fullName}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1 mb-8">
                      {user.status === 'idle' ? 'Available' : 'Currently Busy'}
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => socket.emit("call-user", { targetId: id })}
                        disabled={user.status !== "idle"}
                        className="btn-primary flex items-center justify-center gap-2 py-3 px-4 text-xs disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none"
                      >
                        📹 {user.status !== "idle" ? "Busy" : "Call"}
                      </button>
                      <button
                        onClick={() => setActiveChat(id)}
                        className={`btn-secondary py-3 px-4 text-xs font-bold ${activeChat === id ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''}`}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </div>
      </main>

      {/* Modern Chat Drawer */}
      <div className={`fixed top-6 right-6 bottom-6 w-[420px] glass rounded-[2.5rem] shadow-2xl transition-all duration-500 transform ${activeChat ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0'} z-30 flex flex-col border border-white/40 shadow-indigo-500/10`}>
        {activeChat && activeUser && (
          <>
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                  {activeUser.profilePic ? (
                    <img src={activeUser.profilePic} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                      {activeUser.fullName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 leading-none">{activeUser.fullName}</h3>
                  <span className="text-[10px] font-black text-green-500 uppercase tracking-widest mt-1 inline-block">Online</span>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="w-10 h-10 hover:bg-slate-50 rounded-2xl flex items-center justify-center transition-colors text-slate-400 font-bold">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
              {(messages[activeChat] || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-5 py-3 rounded-3xl shadow-sm text-sm font-medium ${msg.fromMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none border border-slate-100'}`}>
                    {msg.text}
                    <div className={`text-[9px] mt-2 font-bold ${msg.fromMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-8 bg-white/50 backdrop-blur-md rounded-b-[2.5rem] border-t border-slate-100 flex gap-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Compose message..."
                className="input-field border-transparent shadow-inner"
              />
              <button type="submit" className="w-14 h-14 btn-primary p-0 flex items-center justify-center text-xl">
                🚀
              </button>
            </form>
          </>
        )}
      </div>

      {/* Enhanced Call Alerts */}
      {incomingCall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-sm w-full shadow-2xl text-center border border-white/20">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="absolute inset-0 bg-indigo-500 rounded-[2.5rem] animate-ping opacity-20"></div>
              <div className="relative w-full h-full bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white rounded-[2.5rem] flex items-center justify-center text-5xl font-bold shadow-2xl">
                {incomingCall.fromName[0]}
              </div>
            </div>

            <h3 className="text-3xl font-black text-slate-900 leading-tight">Incoming Call</h3>
            <p className="text-slate-500 mt-3 font-semibold mb-10">{incomingCall.fromName} wants to connect</p>

            <div className="flex gap-4">
              <button onClick={handleDecline} className="flex-1 py-5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-500 rounded-2xl font-black transition-all">Decline</button>
              <button onClick={handleAccept} className="flex-1 py-5 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-500/20 transition-all active:scale-95">Accept</button>
            </div>
          </div>
        </div>
      )}

      {outgoingCall && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="glass px-12 py-10 rounded-[3rem] flex flex-col items-center">
            <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin mb-8"></div>
            <p className="text-2xl font-black text-slate-900 tracking-tight">Ringing Peer...</p>
            <button
              onClick={() => { socket.emit("reject-call", { targetId: outgoingCall }); setOutgoingCall(null); }}
              className="mt-10 px-6 py-2 bg-red-50 text-red-600 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
            >
              Cancel Call
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
