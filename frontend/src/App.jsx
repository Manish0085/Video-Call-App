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
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
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
