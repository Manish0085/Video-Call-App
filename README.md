# 🎥 Videly - Real-time Video Conferencing Platform

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Videly** (also known as Lumina) is a powerful, real-time video conferencing application designed for seamless communication. Built on the **MERN** stack and powered by **WebRTC** and **Socket.io**, it enables high-quality video calls, real-time messaging, and dynamic group interactions similar to Zoom or Google Meet.

---

## 🚀 Key Features

### ⚡ **Real-Time Communication**
- **HD Video & Audio**: Crystal clear peer-to-peer streaming using **WebRTC**.
- **Instant Signaling**: Low-latency connection establishment via **Socket.io**.
- **Group Calls**: Mesh networking topology allows multiple users to join a single room.
- **Chat System**: Integrated real-time text chat layout for messages during calls.

### 🎨 **Modern User Experience**
- **Interactive Dashboard**: See who is online in real-time.
- **Call Notifications**:
  - **Ringing State**: Real-time incoming call alerts with Accept/Reject options.
  - **Busy State**: Intelligent handling when users are already on a call.
- **Glassmorphism UI**: A premium, polished interface built with **Tailwind CSS** and **Framer Motion**.
- **Responsive Design**: Fully optimized for desktop and mobile interactions.

### 🛠️ **Core Functionalities**
- **Authentication**: Secure signup and login using **JWT** and **HttpOnly Cookies**.
- **Room Management**: Dynamic room creation for group meetings.
- **Profile System**: User profiles with avatars and status updates.
- **Network Resilience**: Capable of handling connection drops and user re-connections.

---

## 🏗️ System Architecture

The application uses a Hybrid Architecture: **Client-Server** for signaling/auth and **Peer-to-Peer (P2P)** for media streaming.

```mermaid
flowchart TD
    ClientA["User A (React)"]
    ClientB["User B (React)"]
    Server["Backend Server (Node/Express)"]
    DB["MongoDB Cluster"]

    subgraph Signaling & Auth
        ClientA -->|WebSocket (Join, Offer, Ice)| Server
        ClientB -->|WebSocket (Answer, Ice)| Server
        Server -->|JWT Auth & User Data| DB
    end

    subgraph Media Stream (P2P)
        ClientA <-->|WebRTC Video/Audio| ClientB
    end

    note[Socket.io handles the handshake. <br/>Once connected, video flows directly between users.]
```

sequenceDiagram
    participant A as User A (React)
    participant S as Backend Server (Node / Express)
    participant DB as MongoDB
    participant B as User B (React)

    %% Authentication & Signaling
    A->>S: Connect via WebSocket (Socket.io)
    S->>DB: Verify JWT / Fetch User Data
    DB-->>S: Auth Success
    S-->>A: Connection Acknowledged

    B->>S: Connect via WebSocket (Socket.io)
    S->>DB: Verify JWT / Fetch User Data
    DB-->>S: Auth Success
    S-->>B: Connection Acknowledged

    %% WebRTC Signaling
    A->>S: SDP Offer
    S-->>B: Forward SDP Offer

    B->>S: SDP Answer
    S-->>A: Forward SDP Answer

    A->>S: ICE Candidates
    S-->>B: Forward ICE Candidates

    B->>S: ICE Candidates
    S-->>A: Forward ICE Candidates

    %% P2P Media Stream
    A<<-->>B: WebRTC Audio / Video Stream (P2P)


### 🧠 **How it Works**
1.  **Signaling**: Users connect via Socket.io to exchange "contact info" (SDP Offers/Answers).
2.  **ICE Candidates**: The system finds the best network path (Local IP, Public IP) to connect peers.
3.  **P2P Stream**: Once connected, heavy media traffic bypasses the server entirely, ensuring privacy and speed.

---

## 🛠️ Tech Stack

### **Backend (Node.js Ecosystem)**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ORM)
- **Real-time Engine**: Socket.io (v4)
- **Security**: JWT (JSON Web Tokens), BCrypt, Cookie-Parser

### **Frontend (React Ecosystem)**
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS, Framer Motion, Lucide React (Icons)
- **Routing**: React Router DOM 6
- **State Management**: Context API (Auth & Socket Context)
- **Communication**: Socket.io-client, WebRTC API

---

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Instance (Local or Atlas)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/videly.git
cd videly
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies.
```bash
cd backend
npm install
```

**Create a `.env` file in `backend/`:**
```properties
PORT=8000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/videly
JWT_SECRET=your_super_secret_key_123
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Run the server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal and navigate to the frontend folder.
```bash
cd ../frontend
npm install
```

**Create a `.env` file in `frontend/` (Optional if hardcoded):**
```properties
VITE_API_URL=http://localhost:8000
```

Start the client:
```bash
npm run dev
```

Visit `http://localhost:5173` to see the app in action!

---

## 📸 Screenshots

| **Dashboard & User List** | **Video Call Interface** |
|:-------------------------:|:------------------------:|
| ![Dashboard](https://placehold.co/600x400?text=Dashboard+Preview) | ![Call Interface](https://placehold.co/600x400?text=Video+Call+Preview) |
| *Real-time user status and list* | *Immersive video calling experience* |

---

## 🤝 Contribution
Contributions are welcome! Please fork the repository and submit a Pull Request.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/NewFeature`)
3. Commit your Changes (`git commit -m 'Add NewFeature'`)
4. Push to the Branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

---

