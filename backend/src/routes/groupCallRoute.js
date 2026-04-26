/**
 * groupCallRoute.js
 *
 * Routes cho Group Video Call (LiveKit).
 * Tất cả routes đều qua protectedRoute middleware (đã apply ở server.js).
 */

import { Router } from "express";
import { generateRoomToken } from "../services/livekitService.js";

const router = Router();

/**
 * POST /api/group-call/token
 * Body: { conversationId: string }
 * Returns: { token: string, url: string }
 *
 * Frontend dùng token + url để connect tới LiveKit server.
 */
router.post("/token", async (req, res) => {
  try {
    const { conversationId } = req.body;
    const user = req.user;

    if (!conversationId) {
      return res.status(400).json({ message: "conversationId là bắt buộc" });
    }

    const { token, url } = await generateRoomToken({
      userId: user._id.toString(),
      name: user.displayName || user.username || "Unknown",
      roomName: conversationId,
    });

    res.json({ token, url });
  } catch (error) {
    console.error("[GroupCall] Lỗi generate token:", error);
    res.status(500).json({ message: "Không thể tạo token" });
  }
});

export default router;
