import { useEffect, useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { socket } from "../socket";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [messages, setMessages] = useState({}); // { strangerId: [{text, fromMe, time}] }
  const [activeChat, setActiveChat] = useState(null); // strangerId
  const [chatInput, setChatInput] = useState("");
  const navigate = useNavigate();
  const { authUser } = useAuth();

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

  const getActiveUserName = () => {
    const user = users.find(([id]) => id === activeChat);
    return user ? user[1].fullName : "Stranger";
  };

  const getActiveUserPic = () => {
    const user = users.find(([id]) => id === activeChat);
    return user ? user[1].profilePic : "";
  };

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
    <div className="min-h-screen bg-gray-100 flex relative overflow-hidden">
      {/* Main Content */}
      <div className={`flex-1 p-8 transition-all duration-300 ${activeChat ? 'mr-[400px]' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-10 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <Link to="/profile" className="w-14 h-14 bg-blue-100 rounded-2xl overflow-hidden flex items-center justify-center hover:scale-105 transition-all ring-2 ring-blue-500/20">
                {authUser?.profilePic ? (
                  <img src={authUser.profilePic} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-blue-600">{authUser?.fullName[0]}</span>
                )}
              </Link>
              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-tight">Welcome, {authUser?.fullName}</h2>
                <p className="text-xs font-bold text-green-500 uppercase tracking-widest mt-0.5">Ready for calls</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  const roomName = prompt("Enter Group Name:");
                  if (roomName) socket.emit("create-room", { roomName });
                }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 text-sm"
              >
                <span>👪</span> Create Group
              </button>
              <button
                onClick={() => {
                  const roomId = prompt("Enter Room ID:");
                  if (roomId) navigate(`/group/${roomId}`);
                }}
                className="bg-white text-gray-700 border border-gray-200 px-5 py-2.5 rounded-2xl font-bold hover:bg-gray-50 transition-all text-sm"
              >
                Join Room
              </button>
            </div>
          </div>

          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em] mb-6 px-1">Active Now</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {!socket.connected ? (
              <div className="col-span-full py-20 text-center text-gray-400">Connecting...</div>
            ) : users.length <= 1 ? (
              <div className="col-span-full py-20 text-center text-gray-500 bg-white rounded-3xl border border-dashed border-gray-300">
                <div className="text-4xl mb-2">🔭</div>
                <p className="font-medium">No other users online right now</p>
              </div>
            ) : (
              users.map(([id, user]) =>
                id !== socket.id ? (
                  <div key={id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all group">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-[1.4rem] overflow-hidden flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform shadow-sm">
                          {user.profilePic ? (
                            <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl font-bold text-blue-600">{user.fullName[0]}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-900 text-lg leading-tight">{user.fullName}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-2 h-2 rounded-full ${user.status === "idle" ? "bg-green-500" : "bg-amber-500"}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              {user.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      {messages[id]?.length > 0 && !messages[id][messages[id].length - 1].fromMe && (
                        <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-sm animate-bounce"></div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (user.status !== "idle") return;
                          socket.emit("call-user", { targetId: id });
                        }}
                        disabled={user.status !== "idle"}
                        className="flex-1 bg-neutral-900 text-white font-bold py-3 rounded-2xl hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 transition-all flex items-center justify-center gap-2"
                      >
                        📹 {user.status !== "idle" ? "Busy" : "Call"}
                      </button>
                      <button
                        onClick={() => setActiveChat(id)}
                        className={`px-6 py-3 rounded-2xl font-bold transition-all ${activeChat === id ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                      >
                        💬 Chat
                      </button>
                    </div>
                  </div>
                ) : null
              )
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp style Chat Panel */}
      <div className={`fixed top-0 right-0 h-full w-[400px] bg-white border-l shadow-2xl transition-transform duration-300 transform ${activeChat ? 'translate-x-0' : 'translate-x-full'} z-10 flex flex-col`}>
        {activeChat && (
          <>
            {/* Chat Header */}
            <div className="p-5 bg-white border-b flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl overflow-hidden flex items-center justify-center font-bold">
                  {getActiveUserPic() ? (
                    <img src={getActiveUserPic()} alt="User" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl text-blue-600">{getActiveUserName()[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-gray-900">{getActiveUserName()}</p>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Active Chat</p>
                </div>
              </div>
              <button onClick={() => setActiveChat(null)} className="hover:bg-gray-100 w-10 h-10 flex items-center justify-center rounded-2xl text-gray-400 transition-colors">✕</button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8f9fb]">
              {(messages[activeChat] || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm text-sm ${msg.fromMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'}`}>
                    {msg.text}
                    <p className={`text-[9px] mt-1.5 ${msg.fromMe ? 'text-blue-100' : 'text-gray-400'}`}>
                      {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-6 bg-white border-t flex gap-3">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none transition-all placeholder:text-gray-400"
              />
              <button type="submit" className="bg-blue-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                ➤
              </button>
            </form>
          </>
        )}
      </div>

      {/* Call Modal Modals */}
      {incomingCall && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center text-4xl font-bold mb-6 animate-pulse ring-8 ring-blue-50">
                {incomingCall.fromName[0].toUpperCase()}
              </div>
              <h3 className="text-3xl font-black text-gray-900 mb-2">Incoming Call</h3>
              <p className="text-gray-500 mb-10 font-medium">{incomingCall.fromName} wants to video chat</p>

              <div className="flex gap-4 w-full">
                <button onClick={handleDecline} className="flex-1 bg-red-50 text-red-600 font-bold py-4 rounded-2xl hover:bg-red-100 transition-colors">Decline</button>
                <button onClick={handleAccept} className="flex-1 bg-green-500 text-white font-bold py-4 rounded-2xl hover:bg-green-600 shadow-lg shadow-green-200 transition-all active:scale-95">Accept</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {outgoingCall && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="bg-white/90 backdrop-blur-lg px-10 py-8 rounded-[2.5rem] flex flex-col items-center shadow-xl">
            <div className="w-16 h-16 rounded-[1.5rem] border-4 border-blue-600/20 border-t-blue-600 animate-spin mb-6"></div>
            <p className="text-2xl font-black text-gray-900">Calling...</p>
            <button onClick={() => { socket.emit("reject-call", { targetId: outgoingCall }); setOutgoingCall(null); }} className="mt-8 text-red-600 font-bold hover:underline tracking-wide uppercase text-xs">End Attempt</button>
          </div>
        </div>
      )}
    </div>
  );
}
