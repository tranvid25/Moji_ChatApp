/**
 * groupCallService.ts
 * Gọi backend để lấy LiveKit token.
 */
import api from "@/lib/axios";

export const groupCallService = {
  async getToken(
    conversationId: string,
  ): Promise<{ token: string; url: string }> {
    const res = await api.post(
      "/group-call/token",
      { conversationId },
      { withCredentials: true },
    );
    return res.data;
  },
};
