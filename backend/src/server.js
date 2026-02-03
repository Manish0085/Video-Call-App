import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(cookieParser());

// Dynamic CORS for cross-network dev / production
app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in development for cross-network testing (e.g. mobile)
    // In production, you would restrict this to process.env.FRONTEND_URL
    if (!origin || process.env.NODE_ENV === "development") {
      callback(null, true);
    } else {
      if (origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || process.env.NODE_ENV === "development") {
        callback(null, true);
      } else {
        if (origin === process.env.FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true
  }
});

// App Routes
app.use("/api/auth", authRoutes);

const users = new Map();

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);

  socket.on("join", ({ user }) => {
    // user comes from DB now
    users.set(socket.id, {
      _id: user._id,
      fullName: user.fullName,
      profilePic: user.profilePic,
      status: "idle",
      partnerId: null,
      roomId: null
    });
    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("create-room", ({ roomName }) => {
    const roomId = `room-${Math.random().toString(36).substr(2, 9)}`;
    socket.join(roomId);
    const user = users.get(socket.id);
    if (user) {
      user.status = "on-call";
      user.roomId = roomId;
    }
    socket.emit("room-created", { roomId, roomName });
    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("join-room", ({ roomId }) => {
    const user = users.get(socket.id);
    io.to(roomId).emit("user-joined-room", { from: socket.id, name: user?.fullName });

    socket.join(roomId);
    if (user) {
      user.status = "on-call";
      user.roomId = roomId;
    }

    const participants = Array.from(io.sockets.adapter.rooms.get(roomId) || [])
      .filter(id => id !== socket.id);

    socket.emit("room-joined", { roomId, participants });
    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("leave-room", ({ roomId }) => {
    socket.leave(roomId);
    const user = users.get(socket.id);
    if (user) {
      user.status = "idle";
      user.roomId = null;
    }
    io.to(roomId).emit("user-left-room", { from: socket.id });
    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("get-users", () => {
    socket.emit("users-update", Array.from(users.entries()));
  });

  socket.on("call-user", ({ targetId }) => {
    const targetUser = users.get(targetId);
    const caller = users.get(socket.id);

    if (!targetUser || targetUser.status !== "idle") {
      return socket.emit("call-rejected", { reason: "busy" });
    }

    caller.status = "ringing";
    targetUser.status = "ringing";
    caller.partnerId = targetId;
    targetUser.partnerId = socket.id;

    socket.emit("call-initiated", { targetId });
    socket.to(targetId).emit("incoming-call", {
      from: socket.id,
      fromName: caller.fullName || "Unknown"
    });

    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("accept-call", ({ targetId }) => {
    const user = users.get(socket.id);
    const target = users.get(targetId);
    if (user && target) {
      user.status = "on-call";
      target.status = "on-call";
      socket.to(targetId).emit("call-accepted");
      io.emit("users-update", Array.from(users.entries()));
    }
  });

  socket.on("reject-call", ({ targetId }) => {
    const user = users.get(socket.id);
    const target = users.get(targetId);
    if (user) {
      user.status = "idle";
      user.partnerId = null;
    }
    if (target) {
      target.status = "idle";
      target.partnerId = null;
      socket.to(targetId).emit("call-rejected", { reason: "declined" });
    }
    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("send-message", ({ targetId, message }) => {
    socket.to(targetId).emit("receive-message", {
      from: socket.id,
      message,
      timestamp: new Date().toISOString()
    });
  });

  socket.on("offer", ({ targetId, offer, fromRoom }) => {
    socket.to(targetId).emit("offer", {
      from: socket.id,
      offer,
      fromRoom
    });
  });

  socket.on("answer", ({ targetId, answer, fromRoom }) => {
    socket.to(targetId).emit("answer", {
      from: socket.id,
      answer,
      fromRoom
    });
  });

  socket.on("ice-candidate", ({ targetId, candidate, fromRoom }) => {
    socket.to(targetId).emit("ice-candidate", {
      from: socket.id,
      candidate,
      fromRoom
    });
  });

  socket.on("end-call", ({ targetId }) => {
    const user = users.get(socket.id);
    const target = users.get(targetId);
    if (user) {
      user.status = "idle";
      user.partnerId = null;
    }
    if (target) {
      target.status = "idle";
      target.partnerId = null;
      socket.to(targetId).emit("call-ended");
    }
    io.emit("users-update", Array.from(users.entries()));
  });

  socket.on("disconnect", () => {
    const user = users.get(socket.id);
    if (user) {
      if (user.partnerId) {
        const partner = users.get(user.partnerId);
        if (partner) {
          partner.status = "idle";
          partner.partnerId = null;
          socket.to(user.partnerId).emit("call-ended");
        }
      }
      if (user.roomId) {
        io.to(user.roomId).emit("user-left-room", { from: socket.id });
      }
    }
    users.delete(socket.id);
    io.emit("users-update", Array.from(users.entries()));
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  connectDB();
});
