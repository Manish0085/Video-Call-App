import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Phone, Lock, ArrowRight, Loader2, Sparkles } from "lucide-react";

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
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-950 bg-noise">
            {/* Background Ambience */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]"></div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-md w-full glass-dark rounded-[2.5rem] overflow-hidden shadow-2xl relative z-10 border border-white/5"
            >
                <div className="p-8 sm:p-12 relative overflow-hidden">
                    {/* Top Glow */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-800/50 mb-6 shadow-inner ring-1 ring-white/5">
                            <Sparkles className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
                        <p className="text-slate-400 mt-2 text-sm font-medium">Enter your credentials to access the secure line</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Phone Number</label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="tel"
                                    required
                                    className="input-field pl-12 bg-slate-900/50 border-white/5 focus:border-indigo-500/50 focus:bg-slate-900 transition-all rounded-2xl py-4"
                                    placeholder="+1 234 567 8900"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="password"
                                    required
                                    className="input-field pl-12 bg-slate-900/50 border-white/5 focus:border-indigo-500/50 focus:bg-slate-900 transition-all rounded-2xl py-4"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="w-full btn-primary py-4 mt-6 flex items-center justify-center gap-2 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-indigo-500 opacity-100 transition-opacity group-hover:opacity-90"></div>
                            {loading ? (
                                <div className="relative z-10 flex items-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                <div className="relative z-10 flex items-center gap-2">
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-slate-500 text-sm font-medium">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors">
                            Create one now
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
