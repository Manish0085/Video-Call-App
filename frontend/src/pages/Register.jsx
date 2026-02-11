import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, User, Phone, Image, Lock, Sparkles, Loader2 } from "lucide-react";

export default function Register() {
    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        password: "",
        profilePic: "",
    });
    const { signup } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const result = await signup(formData);
        setLoading(false);
        if (result.success) {
            navigate("/users");
        } else {
            alert(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-5%] left-[-5%] w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-5%] right-[-5%] w-64 h-64 sm:w-96 sm:h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-xl w-full glass rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-6 sm:p-10">
                    <div className="text-center mb-8 sm:mb-10">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mx-auto mb-4 sm:mb-6 shadow-xl shadow-indigo-200">
                            <UserPlus className="w-8 h-8 sm:w-10 sm:h-10" />
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                        <p className="text-slate-500 mt-2 sm:mt-3 font-medium text-sm sm:text-base">Join the next-gen communication platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    required
                                    className="input-field pl-12"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="tel"
                                    required
                                    className="input-field pl-12"
                                    placeholder="1234567890"
                                    value={formData.phoneNumber}
                                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Profile Picture URL</label>
                            <div className="relative">
                                <Image className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="input-field pl-12"
                                    placeholder="https://images.unsplash.com/photo-..."
                                    value={formData.profilePic}
                                    onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="password"
                                    required
                                    className="input-field pl-12"
                                    placeholder="Minimum 6 characters"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            className="sm:col-span-2 btn-primary mt-4 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    <span>Get Started</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-8 sm:mt-10 text-slate-600 font-medium text-sm sm:text-base">
                        Already have an account?{" "}
                        <Link to="/login" className="text-indigo-600 font-bold hover:underline">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
