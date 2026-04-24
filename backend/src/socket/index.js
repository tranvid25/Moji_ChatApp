import { Server } from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

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

io.on("connection", async (socket) => {
  const user = socket.user;
  console.log(`socket connected: ${socket.id}`);
  onlineUsers.set(user._id, socket.id);
  io.emit("onlineUsers", Array.from(onlineUsers.keys()));
  const conversationIds=await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id)=>{
    socket.join(id);
  })
  socket.on("disconnect", () => {
    onlineUsers.delete(user._id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));
    console.log(`socket disconnected: ${socket.id}`);
  });
});

export { io };
