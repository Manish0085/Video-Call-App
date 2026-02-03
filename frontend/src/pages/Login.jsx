import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
    const [formData, setFormData] = useState({
        phoneNumber: "",
        password: "",
    });
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await login(formData);
        setLoading(false);
        if (result.success) {
            navigate("/users");
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

            <div className="max-w-md w-full glass rounded-[2.5rem] overflow-hidden shadow-2xl animate-float">
                <div className="p-10">
                    <div className="text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-3xl flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl shadow-indigo-200">
                            ⚡
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
                        <p className="text-slate-500 mt-3 font-medium">Continue your conversations</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="input-field"
                                placeholder="Enter your registered number"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                className="input-field"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="w-full btn-primary mt-4 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-slate-600 font-medium italic">
                        New here?{" "}
                        <Link to="/register" className="text-indigo-600 font-bold hover:underline">
                            Create an account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
