import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { authUser, updateProfile, logout } = useAuth();
    const [formData, setFormData] = useState({
        fullName: authUser?.fullName || "",
        profilePic: authUser?.profilePic || "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const res = await updateProfile(formData);
        setLoading(false);
        if (res.success) {
            alert("Profile updated!");
        } else {
            alert(res.message);
        }
    };

    if (!authUser) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-[2.5rem] shadow-xl overflow-hidden">
                    <div className="bg-blue-600 h-32 relative">
                        <div className="absolute -bottom-16 left-8">
                            <div className="w-32 h-32 bg-white rounded-[2rem] p-1 shadow-lg">
                                <div className="w-full h-full bg-blue-100 rounded-[1.8rem] overflow-hidden flex items-center justify-center border-4 border-white">
                                    {formData.profilePic ? (
                                        <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl font-bold text-blue-600">{authUser.fullName[0].toUpperCase()}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-20 p-8">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <h1 className="text-3xl font-extrabold text-gray-900">{authUser.fullName}</h1>
                                <p className="text-gray-500 font-medium">@{authUser.phoneNumber}</p>
                            </div>
                            <button
                                onClick={() => { logout(); navigate("/login"); }}
                                className="bg-red-100 text-red-600 px-6 py-2 rounded-xl font-bold hover:bg-red-200 transition-all"
                            >
                                Log Out
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Profile Settings</h3>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Profile Picture URL</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.profilePic}
                                    onChange={(e) => setFormData({ ...formData, profilePic: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => navigate("/users")}
                                    className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all"
                                >
                                    Back to Lobby
                                </button>
                                <button
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                                >
                                    {loading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
