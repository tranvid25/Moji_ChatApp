import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";
import User from "../models/User.js";

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
].filter(Boolean);

const io = new Server({
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);
const onlineUsers = new Map();

const emitOnlineUsers = async () => {
  const ids = Array.from(onlineUsers.keys());
  if (ids.length === 0) {
    io.emit("onlineUsers", []);
    return;
  }
  const users = await User.find({
    _id: { $in: ids },
    "preferences.privacy.showOnlineStatus": { $ne: false },
  }).select("_id");

  io.emit(
    "onlineUsers",
    users.map((u) => u._id.toString()),
  );
};

io.on("connection", async (socket) => {
  const user = socket.user;
  const userId = user._id.toString();
  console.log(`socket connected: ${socket.id}`);

  const current = onlineUsers.get(userId) || new Set();
  current.add(socket.id);
  onlineUsers.set(userId, current);
  await emitOnlineUsers();

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  socket.join(userId);
  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  socket.on("privacy-online-status-updated", async () => {
    await emitOnlineUsers();
  });

  // ─── WebRTC Signaling ────────────────────────────────────────────────────

  /**
   * Caller → Server → Callee
   * Payload: { to, conversationId, offer }
   *
   * The server forwards the offer plus caller identity to the callee's socket room.
   */
  socket.on("call-user", ({ to, conversationId, offer }) => {
    if (!to || !offer) return;

    const callerName = user.displayName || user.username || "Unknown";
    const callerAvatar = user.avatarUrl || null;

    // Emit to all sockets belonging to the target user
    io.to(to).emit("incoming-call", {
      from: userId,
      fromName: callerName,
      fromAvatar: callerAvatar,
      conversationId,
      offer,
    });

    console.log(`[WebRTC] call-user: ${userId} → ${to}`);
  });

  /**
   * Callee → Server → Caller
   * Payload: { to, conversationId, answer }
   */
  socket.on("answer-call", ({ to, answer }) => {
    if (!to || !answer) return;

    io.to(to).emit("call-answered", {
      from: userId,
      answer,
    });

    console.log(`[WebRTC] answer-call: ${userId} → ${to}`);
  });

  /**
   * Both sides send ICE candidates through the server.
   * Payload: { to, candidate }
   */
  socket.on("ice-candidate", ({ to, candidate }) => {
    if (!to || !candidate) return;

    io.to(to).emit("ice-candidate", {
      from: userId,
      candidate,
    });
  });

  /**
   * Either side can end / reject the call.
   * Payload: { to, conversationId, reason }
   */
  socket.on("end-call", ({ to, reason }) => {
    if (!to) return;

    io.to(to).emit("call-ended", {
      from: userId,
      reason: reason || "ended",
    });

    console.log(`[WebRTC] end-call: ${userId} → ${to} (${reason})`);
  });

  // ─── Disconnect ──────────────────────────────────────────────────────────

  socket.on("disconnect", async () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
      } else {
        onlineUsers.set(userId, sockets);
      }
    }
    await emitOnlineUsers();
    console.log(`socket disconnected: ${socket.id}`);
  });
});

export { io };

