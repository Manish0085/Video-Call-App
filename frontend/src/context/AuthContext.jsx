import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Base URL for API
// Base URL for API - automatically detects host for cross-network support
const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;
const API_URL = `${API_BASE}/api/auth`;
axios.defaults.withCredentials = true;

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const checkAuth = async () => {
        try {
            const res = await axios.get(`${API_URL}/check`);
            setAuthUser(res.data);
        } catch (error) {
            setAuthUser(null);
        } finally {
            setIsCheckingAuth(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const signup = async (data) => {
        try {
            const res = await axios.post(`${API_URL}/signup`, data);
            setAuthUser(res.data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Signup failed" };
        }
    };

    const login = async (data) => {
        try {
            const res = await axios.post(`${API_URL}/login`, data);
            setAuthUser(res.data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Login failed" };
        }
    };

    const logout = async () => {
        try {
            await axios.post(`${API_URL}/logout`);
            setAuthUser(null);
        } catch (error) {
            console.error("Logout error", error);
        }
    };

    const updateProfile = async (data) => {
        try {
            const res = await axios.put(`${API_URL}/update-profile`, data);
            setAuthUser(res.data);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || "Update failed" };
        }
    }

    return (
        <AuthContext.Provider value={{ authUser, isCheckingAuth, signup, login, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
};
