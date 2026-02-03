import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

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
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-[-5%] left-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="max-w-xl w-full glass rounded-[2.5rem] overflow-hidden shadow-2xl">
                <div className="p-10">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-3xl flex items-center justify-center text-white text-4xl mx-auto mb-6 shadow-xl shadow-indigo-200">
                            👋
                        </div>
                        <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Create Account</h2>
                        <p className="text-slate-500 mt-3 font-medium">Join the next-gen communication platform</p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Full Name</label>
                            <input
                                type="text"
                                required
                                className="input-field"
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Phone Number</label>
                            <input
                                type="tel"
                                required
                                className="input-field"
                                placeholder="1234567890"
                                value={formData.phoneNumber}
                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Profile Picture URL</label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="https://images.unsplash.com/photo-..."
                                value={formData.profilePic}
                                onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-sm font-bold text-slate-700 ml-1">Password</label>
                            <input
                                type="password"
                                required
                                className="input-field"
                                placeholder="Minimum 6 characters"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>

                        <button
                            disabled={loading}
                            className="md:col-span-2 btn-primary mt-4 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating Account...</span>
                                </div>
                            ) : (
                                "Get Started"
                            )}
                        </button>
                    </form>

                    <p className="text-center mt-10 text-slate-600 font-medium">
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
