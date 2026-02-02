import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "../socket";

export default function Join() {
  const [name, setName] = useState("");
  const [callType, setCallType] = useState("video");
  const navigate = useNavigate();

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name) return;

    socket.emit("join", { name, callType });
    navigate("/users");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Join Meet</h1>
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Your Name"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Call Type</label>
            <select
              value={callType}
              onChange={(e) => setCallType(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="video">Video Call</option>
              <option value="audio">Audio Only</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition duration-200"
          >
            Join Lobby
          </button>
        </form>
      </div>
    </div>
  );
}
