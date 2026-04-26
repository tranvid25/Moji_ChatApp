import api from "@/lib/axios";
export const friendService = {
  async searchUserByUsername(username: string) {
    const res = await api.get(`/user/search?username=${username}`);
    return res.data.user;
  },
  async sendFriendRequest(to: string, message?: string) {
    const res = await api.post("/friends/requests", { to, message });
    return res.data?.message ?? "Đã gửi lời mời kết bạn";
  },
  async getAllFriendRequest() {
    try {
      const res = await api.get("/friends/requests", { withCredentials: true });
      const { sent, received } = res.data;
      return { sent, received };
    } catch (error) {
      console.error("Lỗi khi gửi gửi lời mời bạn bè:", error);
    }
  },
  async acceptRequest(requestId: string) {
    try {
      const res = await api.post(
        `/friends/requests/${requestId}/accept`,
        {},
        { withCredentials: true },
      );
      return res.data?.newFriend;
    } catch (error) {
      console.error("Lỗi khi chấp nhận lời mời bạn bè:", error);
      throw error;
    }
  },
  async declineRequest(requestId: string) {
    try {
      await api.post(
        `/friends/requests/${requestId}/decline`,
        {},
        { withCredentials: true },
      );
    } catch (error) {
      console.error("Lỗi khi từ chối lời mời bạn bè:", error);
      throw error;
    }
  },
  async getFriendList() {
    const res = await api.get("/friends");
    return res.data.friends;
  },
};
