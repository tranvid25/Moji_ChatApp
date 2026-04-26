import api from "@/lib/axios";

export const userService = {
  uploadAvatar: async (formData: FormData) => {
    const res = await api.post("/user/uploadAvatar", formData, {
      headers: { "content-type": "multipart/form-data" },
      withCredentials: true,
    });
    if (res.status === 400) {
      throw new Error(res.data.message);
    }
    return res.data;
  },

  updateOnlineStatus: async (showOnlineStatus: boolean) => {
    const res = await api.patch("/settings/privacy/online-status", {
      showOnlineStatus,
    });
    return res.data;
  },

  updateNotifications: async (payload: {
    friendRequest?: boolean;
    directMessage?: boolean;
    groupMessage?: boolean;
  }) => {
    const res = await api.patch("/settings/notifications", payload);
    return res.data;
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await api.patch("/settings/password", {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  getBlockCandidates: async () => {
    const res = await api.get("/settings/blocks/candidates");
    return res.data.candidates;
  },

  blockUser: async (blockedUserId: string) => {
    await api.post("/settings/blocks", { blockedUserId });
  },

  unblockUser: async (blockedUserId: string) => {
    await api.delete(`/settings/blocks/${blockedUserId}`);
  },

  getBlockedUsers: async () => {
    const res = await api.get("/settings/blocks");
    return res.data.users;
  },

  reportUser: async (payload: {
    targetUserId: string;
    reason: string;
    conversationId?: string;
  }) => {
    await api.post("/settings/reports", payload);
  },

  leaveGroupConversation: async (conversationId: string) => {
    await api.post(`/settings/conversations/${conversationId}/leave`);
  },

  renameGroupConversation: async (conversationId: string, name: string) => {
    const res = await api.patch(`/settings/conversations/${conversationId}/name`, {
      name,
    });
    return res.data;
  },

  muteGroupConversation: async (conversationId: string, muted: boolean) => {
    const res = await api.patch(`/settings/conversations/${conversationId}/mute`, {
      muted,
    });
    return res.data;
  },
};