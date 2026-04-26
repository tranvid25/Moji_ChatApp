/**
 * livekitService.js
 *
 * Tạo JWT token cho LiveKit room.
 * Caller → POST /api/group-call/token → nhận { token, url }
 * → dùng để connect tới LiveKit server từ browser.
 */

import { AccessToken } from "livekit-server-sdk";

export const generateRoomToken = async ({ userId, name, roomName }) => {
  const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
  const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";
  const LIVEKIT_URL = process.env.LIVEKIT_URL || "ws://localhost:7880";

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: userId,
    name,
    ttl: "2h",
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  return { token, url: LIVEKIT_URL };
};
