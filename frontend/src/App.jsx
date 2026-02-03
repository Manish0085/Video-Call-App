import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Join from "./pages/Join";
import Users from "./pages/Users";
import Call from "./pages/Call";
import GroupCall from "./pages/GroupCall";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Profile from "./pages/Profile";

function AppContent() {
  const { authUser, isCheckingAuth } = useAuth();

  if (isCheckingAuth) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 border-4 border-indigo-600/20 border-t-indigo-600 rounded-[2rem] animate-spin mb-4"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] animate-pulse">Lumina initializing</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={authUser ? <Navigate to="/users" /> : <Register />} />
      <Route path="/register" element={authUser ? <Navigate to="/users" /> : <Register />} />
      <Route path="/login" element={authUser ? <Navigate to="/users" /> : <Login />} />

      <Route path="/users" element={authUser ? <Users /> : <Navigate to="/login" />} />
      <Route path="/profile" element={authUser ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/call/:id" element={authUser ? <Call /> : <Navigate to="/login" />} />
      <Route path="/group/:roomId" element={authUser ? <GroupCall /> : <Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
