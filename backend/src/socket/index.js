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

// ─── Group Call Room State ────────────────────────────────────────────────────
// groupCallRooms: Map<conversationId, Set<userId>>
// Tracks who is currently in a live group call room.
const groupCallRooms = new Map();

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


  // ─── Group Call Signaling (LiveKit) ───────────────────────────────────────
  //
  // LiveKit handles ALL media/transport.
  // Socket.IO chỉ dùng để: notify ai đang gọi, invite participants, và broadcast
  // các sự kiện join/leave để UI cập nhật.

  /**
   * Caller bắt đầu cuộc gọi nhóm.
   * Payload: { conversationId, groupName, participantIds }
   */
  socket.on("start-group-call", ({ conversationId, groupName, participantIds }) => {
    if (!conversationId || !participantIds) return;

    const callerName = user.displayName || user.username || "Unknown";
    const callerAvatar = user.avatarUrl || null;

    // Gửi thông báo tới từng thành viên (Trừ người gọi)
    participantIds.forEach(pId => {
      // Bảo vệ: pId và userId phải tồn tại
      if (pId && userId && pId.toString() !== userId.toString()) {
        io.to(pId.toString()).emit("incoming-group-call", {
          conversationId,
          groupName,
          callerName,
          callerAvatar,
          callerId: userId,
        });
      }
    });

    console.log(`[GroupCall] ${callerName} invited ${participantIds.length} users in ${conversationId}`);
  });

  /**
   * User tham gia cuộc gọi – thông báo cho các người khác.
   * Payload: { conversationId }
   */
  socket.on("join-group-call", ({ conversationId }) => {
    if (!conversationId) return;

    // Actually join the socket.io room so the user receives events
    socket.join(conversationId);

    // Track in room state
    if (!groupCallRooms.has(conversationId)) {
      groupCallRooms.set(conversationId, new Set());
    }
    groupCallRooms.get(conversationId).add(userId);

    // Notify others already in the room
    socket.to(conversationId).emit("participant-joined-group-call", {
      userId,
      userName: user.displayName || user.username,
      conversationId,
    });

    // Send the new user a list of existing participants
    const existingParticipants = Array.from(
      groupCallRooms.get(conversationId)
    ).filter((id) => id !== userId);

    socket.emit("group-call-participants", {
      conversationId,
      participants: existingParticipants,
    });

    console.log(
      `[GroupCall] ${userId} joined room ${conversationId}. Room size: ${groupCallRooms.get(conversationId).size}`
    );
  });

  /**
   * User rời cuộc gọi.
   * Payload: { conversationId }
   */
  socket.on("leave-group-call", ({ conversationId }) => {
    if (!conversationId) return;

    _leaveGroupCallRoom(socket, userId, conversationId);
    console.log(`[GroupCall] ${userId} left room ${conversationId}`);
  });

  /**
   * Caller / host ends the call for everyone.
   * Payload: { conversationId }
   */
  socket.on("end-group-call", ({ conversationId }) => {
    if (!conversationId) return;

    io.to(conversationId).emit("group-call-ended", { conversationId });

    // Clean up room state
    groupCallRooms.delete(conversationId);
    console.log(`[GroupCall] Room ${conversationId} ended by ${userId}`);
  });

  /**
   * User từ chối cuộc gọi – báo lại cho caller.
   * Payload: { conversationId, callerId }
   */
  socket.on("reject-group-call", ({ conversationId, callerId }) => {
    if (!callerId) return;

    io.to(callerId).emit("group-call-rejected", {
      userId,
      userName: user.displayName || user.username,
      conversationId,
    });
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

    // Auto-leave any group call rooms this socket was part of
    for (const [conversationId, members] of groupCallRooms.entries()) {
      if (members.has(userId)) {
        _leaveGroupCallRoom(socket, userId, conversationId);
      }
    }

    console.log(`socket disconnected: ${socket.id}`);
  });
});

// ─── Helper ───────────────────────────────────────────────────────────────────

function _leaveGroupCallRoom(socket, userId, conversationId) {
  socket.leave(conversationId);

  const room = groupCallRooms.get(conversationId);
  if (room) {
    room.delete(userId);
    if (room.size === 0) {
      // Last person left – clean up
      groupCallRooms.delete(conversationId);
    }
  }

  socket.to(conversationId).emit("participant-left-group-call", {
    userId,
    conversationId,
  });
}

export { io };

