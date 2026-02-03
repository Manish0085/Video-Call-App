import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8000`;
export const socket = io(SOCKET_URL);
